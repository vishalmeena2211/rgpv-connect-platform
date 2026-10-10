'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';
import { z } from 'zod';

import { rateLimit } from '@/lib/rate-limit';
import { getCurrentUser, isVerified } from '@/lib/session';
import {
  ALLOWED_TYPES,
  type AllowedType,
  createUploadTarget,
  deleteStored,
  MAX_UPLOAD_BYTES,
  newKey,
  publicUrl,
  storedSize,
  type UploadTarget,
} from '@/lib/storage';

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Step 1 of an upload: a signed URL the browser sends the file to directly. */
export async function startUpload(params: { contentType: string; size: number }): Promise<Result<{ target: UploadTarget }>> {
  const user = await getCurrentUser();
  if (!user || !isVerified(user)) return { ok: false, error: 'Verify your enrollment to upload.' };
  if (!(params.contentType in ALLOWED_TYPES)) return { ok: false, error: 'Upload a PDF, or photos as JPG or PNG.' };
  if (!Number.isFinite(params.size) || params.size <= 0 || params.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'Files can be up to 25 MB.' };
  }
  const limit = await rateLimit(`upload:${user.id}`, 20, 86_400);
  if (!limit.ok) return { ok: false, error: 'You have uploaded a lot today. Try again tomorrow.' };

  const type = params.contentType as AllowedType;
  const target = await createUploadTarget(newKey(user.id, type), type, params.size);
  return { ok: true, target };
}

const detailsSchema = z.object({
  type: z.enum(['NOTE', 'PAPER']),
  subjectId: z.coerce.number().int().positive(),
  title: z.string().trim().min(4, 'Say what the file covers.').max(140),
  unitName: z.string().trim().max(60).optional(),
  session: z
    .string()
    .trim()
    .regex(/^(Jun|Dec) 20\d\d$/, 'Pick the exam session.')
    .optional(),
  declaredOwnWork: z.literal(true, { errorMap: () => ({ message: 'Confirm you may share this file.' }) }),
});

/** Step 2: register the uploaded file for review. */
export async function submitResource(params: z.input<typeof detailsSchema> & { key: string }): Promise<Result<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || !isVerified(user)) return { ok: false, error: 'Verify your enrollment to upload.' };
  const parsed = detailsSchema.safeParse(params);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form.' };
  if (parsed.data.type === 'PAPER' && !parsed.data.session) return { ok: false, error: 'Pick the exam session.' };
  if (!params.key.startsWith(`resources/${user.id}/`)) return { ok: false, error: 'Upload the file again.' };

  const size = await storedSize(params.key);
  if (!size) return { ok: false, error: 'The file did not finish uploading. Try again.' };
  const subject = await prisma.subject.findUnique({ where: { id: parsed.data.subjectId }, select: { id: true } });
  if (!subject) return { ok: false, error: 'Pick a subject from the list.' };

  const resource = await prisma.resource.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      unitName: parsed.data.unitName || null,
      session: parsed.data.type === 'PAPER' ? parsed.data.session : null,
      subjectId: subject.id,
      pdfUrl: publicUrl(params.key),
      fileKey: params.key,
      fileSize: size,
      uploaderId: user.id,
      declaredOwnWork: true,
    },
  });
  revalidatePath('/uploads');
  return { ok: true, id: resource.id };
}

/** Fix the details of a sent-back upload and put it back in the review queue. */
export async function resubmitResource(id: string, params: Omit<z.input<typeof detailsSchema>, 'type'>): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  const existing = await prisma.resource.findFirst({ where: { id, uploaderId: user.id }, select: { type: true, status: true } });
  if (!existing) return { ok: false, error: 'Upload not found.' };
  if (existing.status === 'APPROVED') return { ok: false, error: 'This one is already published.' };
  const parsed = detailsSchema.safeParse({ ...params, type: existing.type });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form.' };

  await prisma.resource.update({
    where: { id },
    data: {
      title: parsed.data.title,
      unitName: parsed.data.unitName || null,
      session: existing.type === 'PAPER' ? (parsed.data.session ?? null) : null,
      subjectId: parsed.data.subjectId,
      status: 'PENDING',
      reviewNote: null,
      reviewedAt: null,
      reviewedById: null,
    },
  });
  revalidatePath('/uploads');
  return { ok: true };
}

/** Remove one of your own uploads, and its file. */
export async function removeResource(id: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  const resource = await prisma.resource.findFirst({ where: { id, uploaderId: user.id }, select: { fileKey: true } });
  if (!resource) return { ok: false, error: 'Upload not found.' };
  await prisma.resource.delete({ where: { id } });
  if (resource.fileKey) await deleteStored(resource.fileKey);
  revalidatePath('/uploads');
  revalidatePath('/notes');
  revalidatePath('/papers');
  return { ok: true };
}

/** One rating per person; the average is recomputed on the resource. */
export async function rateResource(id: string, stars: number): Promise<Result<{ rating: number; ratingCount: number }>> {
  const user = await getCurrentUser();
  if (!user || !isVerified(user)) return { ok: false, error: 'Verify your enrollment to rate.' };
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { ok: false, error: 'Pick 1 to 5 stars.' };
  const resource = await prisma.resource.findFirst({ where: { id, status: 'APPROVED' }, select: { uploaderId: true } });
  if (!resource) return { ok: false, error: 'Not found.' };
  if (resource.uploaderId === user.id) return { ok: false, error: 'You cannot rate your own upload.' };

  const summary = await prisma.$transaction(async (tx) => {
    await tx.resourceRating.upsert({
      where: { resourceId_userId: { resourceId: id, userId: user.id } },
      create: { resourceId: id, userId: user.id, stars },
      update: { stars },
    });
    const agg = await tx.resourceRating.aggregate({ where: { resourceId: id }, _avg: { stars: true }, _count: true });
    const rating = Math.round((agg._avg.stars ?? 0) * 10) / 10;
    await tx.resource.update({ where: { id }, data: { rating, ratingCount: agg._count } });
    return { rating, ratingCount: agg._count };
  });
  revalidatePath(`/resources/${id}`);
  return { ok: true, ...summary };
}
