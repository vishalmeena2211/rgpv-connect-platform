'use server';

import { revalidatePath } from 'next/cache';
import { type Prisma, prisma } from '@rgpv/db';
import { z } from 'zod';

import { notify } from '@/features/notifications/notify';
import { audit } from '@/lib/audit';
import { runParserCheck, warmSessionPool } from '@/lib/result-worker';
import { requireAdmin } from '@/lib/session';
import { deleteStored } from '@/lib/storage';

import { advanceDeclaration, sampleBatch, type SampleCheck } from './results-day';

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// ---------------------------------------------------------------- Review

export async function publishResource(id: string): Promise<Result> {
  const admin = await requireAdmin();
  const resource = await prisma.resource.update({
    where: { id },
    data: { status: 'APPROVED', reviewNote: null, reviewedById: admin.id, reviewedAt: new Date() },
    select: { uploaderId: true, title: true },
  });
  await audit({ actorId: admin.id, action: 'resource.publish', targetType: 'Resource', targetId: id });
  await notify({
    recipientId: resource.uploaderId,
    actorId: admin.id,
    type: 'RESOURCE_REVIEWED',
    entityId: id,
    data: { title: resource.title, approved: true },
    push: { title: 'Your upload was published', body: resource.title, url: '/uploads' },
  });
  revalidatePath('/admin/review');
  return { ok: true };
}

export async function rejectResource(id: string, note: string): Promise<Result> {
  const admin = await requireAdmin();
  const trimmed = note.trim();
  if (trimmed.length < 8) return { ok: false, error: 'Tell the uploader why, and what would fix it.' };
  const resource = await prisma.resource.update({
    where: { id },
    data: { status: 'REJECTED', reviewNote: trimmed.slice(0, 500), reviewedById: admin.id, reviewedAt: new Date() },
    select: { uploaderId: true, title: true },
  });
  await audit({ actorId: admin.id, action: 'resource.reject', targetType: 'Resource', targetId: id, data: { note: trimmed } });
  await notify({
    recipientId: resource.uploaderId,
    actorId: admin.id,
    type: 'RESOURCE_REVIEWED',
    entityId: id,
    data: { title: resource.title, approved: false, note: trimmed },
    push: { title: 'Your upload was not published', body: trimmed.slice(0, 120), url: '/uploads' },
  });
  revalidatePath('/admin/review');
  return { ok: true };
}

/** Reports were wrong: show the post again and close its reports. */
export async function restorePost(id: string): Promise<Result> {
  const admin = await requireAdmin();
  await prisma.$transaction([
    prisma.post.update({ where: { id }, data: { hiddenAt: null } }),
    prisma.report.updateMany({ where: { postId: id, status: 'OPEN' }, data: { status: 'DISMISSED', resolvedById: admin.id, resolvedAt: new Date() } }),
  ]);
  await audit({ actorId: admin.id, action: 'post.restore', targetType: 'Post', targetId: id });
  revalidatePath('/admin/review');
  return { ok: true };
}

/** Remove a post; three removals in 90 days pause the author's posting for 30 days. */
export async function removePost(id: string, reason: string): Promise<Result> {
  const admin = await requireAdmin();
  if (reason.trim().length < 4) return { ok: false, error: 'Give a reason; the author sees it.' };
  const post = await prisma.post.update({
    where: { id },
    data: { removedAt: new Date(), removalReason: reason.trim().slice(0, 300) },
    select: { authorId: true },
  });
  await prisma.report.updateMany({ where: { postId: id, status: 'OPEN' }, data: { status: 'UPHELD', resolvedById: admin.id, resolvedAt: new Date() } });
  const recent = await prisma.post.count({ where: { authorId: post.authorId, removedAt: { gt: new Date(Date.now() - 90 * 86_400_000) } } });
  if (recent >= 3) {
    await prisma.user.update({ where: { id: post.authorId }, data: { postingSuspendedUntil: new Date(Date.now() + 30 * 86_400_000) } });
  }
  await audit({ actorId: admin.id, action: 'post.remove', targetType: 'Post', targetId: id, data: { reason, suspended: recent >= 3 } });
  revalidatePath('/admin/review');
  return { ok: true };
}

export async function dismissListingReports(listingId: string, remove: boolean): Promise<Result> {
  const admin = await requireAdmin();
  await prisma.report.updateMany({
    where: { listingId, status: 'OPEN' },
    data: { status: remove ? 'UPHELD' : 'DISMISSED', resolvedById: admin.id, resolvedAt: new Date() },
  });
  if (remove) await prisma.marketListing.delete({ where: { id: listingId } }).catch(() => undefined);
  await audit({ actorId: admin.id, action: remove ? 'listing.remove' : 'listing.keep', targetType: 'MarketListing', targetId: listingId });
  revalidatePath('/admin/review');
  return { ok: true };
}

// ---------------------------------------------------------------- Results day

const declareSchema = z.object({ semester: z.number().int().min(1).max(8), admissionYear: z.number().int().min(2000).max(2100) });

export async function checkDeclaration(input: z.input<typeof declareSchema>): Promise<Result<{ sample: SampleCheck; students: number }>> {
  await requireAdmin();
  const parsed = declareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pick a semester and batch.' };
  const [sample, students] = await Promise.all([
    sampleBatch(parsed.data.semester, parsed.data.admissionYear),
    prisma.user.count({ where: { admissionYear: parsed.data.admissionYear, verificationStatus: 'VERIFIED', enrollmentNumber: { not: null } } }),
  ]);
  return { ok: true, sample, students };
}

export async function startDeclaration(input: z.input<typeof declareSchema> & { sample: SampleCheck; checkedByHand: boolean }): Promise<Result<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = declareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pick a semester and batch.' };
  if (!input.checkedByHand) return { ok: false, error: 'Confirm you checked the portal yourself.' };
  if (input.sample.checked === 0 || input.sample.found < input.sample.checked) {
    return { ok: false, error: `Only ${input.sample.found} of ${input.sample.checked} sample numbers have a result. Wait until all do.` };
  }
  const running = await prisma.resultsDeclaration.findFirst({ where: { status: 'RUNNING' } });
  if (running) return { ok: false, error: 'Another run is still going. Stop it or wait for it to finish.' };

  const total = await prisma.user.count({ where: { admissionYear: parsed.data.admissionYear, verificationStatus: 'VERIFIED', enrollmentNumber: { not: null } } });
  const run = await prisma.resultsDeclaration.create({
    data: { ...parsed.data, totalStudents: total, sampleCheck: input.sample as unknown as Prisma.InputJsonValue, startedById: admin.id },
  });
  await audit({ actorId: admin.id, action: 'results.declare', targetType: 'ResultsDeclaration', targetId: run.id, data: { ...parsed.data, total } });
  await warmSessionPool().catch(() => undefined);
  revalidatePath('/admin/results-day');
  return { ok: true, id: run.id };
}

/** Called by the admin page while it is open, and by the cron route otherwise. */
export async function stepDeclaration(id: string): Promise<Result<{ more: boolean; processed: number; total: number; fetched: number; failed: number }>> {
  await requireAdmin();
  const more = await advanceDeclaration(id);
  const run = await prisma.resultsDeclaration.findUniqueOrThrow({ where: { id } });
  return { ok: true, more, processed: run.processed, total: run.totalStudents, fetched: run.fetched, failed: run.failed };
}

export async function stopDeclaration(id: string): Promise<Result> {
  const admin = await requireAdmin();
  await prisma.resultsDeclaration.update({ where: { id }, data: { status: 'STOPPED', finishedAt: new Date() } });
  await audit({ actorId: admin.id, action: 'results.stop', targetType: 'ResultsDeclaration', targetId: id });
  revalidatePath('/admin/results-day');
  return { ok: true };
}

// ---------------------------------------------------------------- Worker

export async function triggerParserCheck(): Promise<Result<{ detail: string; healthy: boolean }>> {
  const admin = await requireAdmin();
  try {
    const result = (await runParserCheck()) as { ok?: boolean; detail?: string };
    await audit({ actorId: admin.id, action: 'worker.parser_check', targetType: 'Worker', data: result as Prisma.InputJsonValue });
    revalidatePath('/admin/worker');
    return { ok: true, healthy: Boolean(result.ok), detail: result.detail ?? '' };
  } catch {
    return { ok: false, error: 'The worker did not answer.' };
  }
}

export async function triggerWarmPool(): Promise<Result> {
  await requireAdmin();
  try {
    await warmSessionPool();
    return { ok: true };
  } catch {
    return { ok: false, error: 'The worker did not answer.' };
  }
}

// ---------------------------------------------------------------- Privacy and identity

/** Delete an account after its seven-day wait. Files go too; the request row stays. */
export async function completeDeletion(requestId: string): Promise<Result> {
  const admin = await requireAdmin();
  const request = await prisma.deletionRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== 'PENDING') return { ok: false, error: 'This request is not pending.' };
  if (request.eligibleAt > new Date()) return { ok: false, error: 'The seven-day wait is not over yet.' };

  if (request.userId) {
    const files = await prisma.resource.findMany({ where: { uploaderId: request.userId, fileKey: { not: null } }, select: { fileKey: true } });
    await prisma.conversation.deleteMany({ where: { members: { some: { userId: request.userId } } } });
    await prisma.user.delete({ where: { id: request.userId } });
    await Promise.all(files.map((f) => deleteStored(f.fileKey!)));
  }
  await prisma.deletionRequest.update({ where: { id: requestId }, data: { status: 'COMPLETED', completedAt: new Date(), completedById: admin.id } });
  await audit({ actorId: admin.id, action: 'user.delete', targetType: 'DeletionRequest', targetId: requestId, data: { label: request.userLabel } });
  revalidatePath('/admin/privacy');
  return { ok: true };
}

/**
 * Decide an identity claim. "Release" takes the number off the holder (their
 * account goes back to unverified) so the claimant can verify; "keep" closes it.
 */
export async function resolveDispute(id: string, decision: 'RELEASED' | 'KEPT', note: string): Promise<Result> {
  const admin = await requireAdmin();
  const dispute = await prisma.identityDispute.findUnique({ where: { id } });
  if (!dispute || dispute.status !== 'OPEN') return { ok: false, error: 'This claim is already decided.' };

  await prisma.$transaction(async (tx) => {
    if (decision === 'RELEASED') {
      await tx.user.update({
        where: { id: dispute.holderId },
        data: { enrollmentNumber: null, verificationStatus: 'PENDING', verifiedAt: null, collegeId: null, branchCode: null, admissionYear: null, graduatingBatch: null },
      });
      await tx.resultRecord.deleteMany({ where: { userId: dispute.holderId } });
      await tx.groupMember.deleteMany({ where: { userId: dispute.holderId } });
    }
    await tx.identityDispute.update({
      where: { id },
      data: { status: decision, resolutionNote: note.trim().slice(0, 500) || null, resolvedById: admin.id, resolvedAt: new Date() },
    });
  });
  await audit({ actorId: admin.id, action: `dispute.${decision.toLowerCase()}`, targetType: 'IdentityDispute', targetId: id, data: { note } });
  revalidatePath('/admin/privacy');
  return { ok: true };
}

// ---------------------------------------------------------------- Students

const cohortSchema = z.object({
  collegeCode: z.string().regex(/^\d{4}$/),
  branchCode: z.string().regex(/^[A-Z]{2}$/),
  graduatingBatch: z.number().int().min(2000).max(2100),
  size: z.number().int().min(1).max(2000),
});

export async function saveCohortSize(input: z.input<typeof cohortSchema>): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = cohortSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'College code is 4 digits, branch 2 letters, size 1 to 2,000.' };
  const { size, ...key } = parsed.data;
  await prisma.cohortSize.upsert({ where: { collegeCode_branchCode_graduatingBatch: key }, create: { ...key, size }, update: { size } });
  await audit({ actorId: admin.id, action: 'cohort.size', targetType: 'CohortSize', data: parsed.data });
  revalidatePath('/admin/students');
  return { ok: true };
}

export async function setRole(userId: string, role: 'STUDENT' | 'RECRUITER' | 'MENTOR' | 'ADMIN'): Promise<Result> {
  const admin = await requireAdmin();
  if (userId === admin.id && role !== 'ADMIN') return { ok: false, error: 'You cannot remove your own admin role.' };
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await audit({ actorId: admin.id, action: 'user.role', targetType: 'User', targetId: userId, data: { role } });
  revalidatePath('/admin/students');
  return { ok: true };
}
