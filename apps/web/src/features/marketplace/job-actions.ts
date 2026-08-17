'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@rgpv/db';

import { getCurrentUser } from '@/lib/session';

/** Result of creating a job post. */
export type JobActionResult = { ok: true } | { ok: false; error: string };

/** Validates recruiter-submitted job fields before persisting. */
const jobSchema = z.object({
  title: z.string().trim().min(3).max(120),
  company: z.string().trim().min(2).max(120),
  location: z.string().trim().max(120).optional(),
  type: z.enum(['FULL_TIME', 'INTERNSHIP', 'PART_TIME']),
  description: z.string().trim().min(10).max(5000),
  applyUrl: z.string().trim().url(),
  isRemote: z.boolean(),
});

/**
 * Create a job post. Restricted to RECRUITER and ADMIN roles — students browse
 * and apply, but only recruiters list openings (a paid feature later).
 */
export async function createJob(input: unknown): Promise<JobActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
    return { ok: false, error: 'Only recruiter accounts can post jobs.' };
  }

  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid job details.' };
  }

  await prisma.jobPost.create({
    data: { ...parsed.data, postedById: user.id },
  });

  revalidatePath('/jobs');
  return { ok: true };
}
