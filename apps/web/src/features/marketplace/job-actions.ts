'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/session';

export type JobActionResult = { ok: true } | { ok: false; error: string };

const jobSchema = z.object({
  title: z.string().trim().min(3, 'Add a job title.').max(120),
  company: z.string().trim().min(2, 'Add the company.').max(120),
  location: z.string().trim().max(120).optional(),
  type: z.enum(['FULL_TIME', 'INTERNSHIP', 'PART_TIME']),
  pay: z.string().trim().max(60).optional(),
  description: z.string().trim().min(10, 'Describe the role in a sentence or two.').max(5000),
  applyUrl: z.string().trim().url('Add a link where students apply.'),
  isRemote: z.boolean(),
  branches: z.array(z.string().regex(/^[A-Z]{2}$/)).max(20),
  batches: z.array(z.number().int().min(2000).max(2100)).max(6),
  closesAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Post a job. Only recruiter and admin accounts can post (placement cells are
 * recruiter accounts tied to a college). Free: no paid or featured posts.
 */
export async function createJob(input: z.input<typeof jobSchema>): Promise<JobActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in first.' };
  if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') return { ok: false, error: 'Only verified recruiters and placement cells can post jobs.' };
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form.' };
  const { closesAt, location, pay, ...rest } = parsed.data;
  if (closesAt && new Date(closesAt) <= new Date()) return { ok: false, error: 'The closing date has to be in the future.' };

  await prisma.jobPost.create({
    data: {
      ...rest,
      location: location || null,
      pay: pay || null,
      closesAt: closesAt ? new Date(`${closesAt}T23:59:59+05:30`) : null,
      source: user.role === 'RECRUITER' && user.collegeId ? 'PLACEMENT_CELL' : 'RECRUITER',
      postedById: user.id,
    },
  });
  revalidatePath('/jobs');
  return { ok: true };
}
