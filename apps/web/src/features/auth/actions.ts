'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';
import { parseEnrollment } from '@rgpv/shared';

import { auth } from '@/auth';
import { fetchResult, ResultWorkerError } from '@/lib/result-worker';

/** Result of the "look up my result" step of enrollment verification. */
export type EnrollmentPreview =
  | { ok: true; name: string; college: string; branch: string; batch: number }
  | { ok: false; error: string };

/**
 * Step 1 of verification: fetch the student's result to prove ownership of the
 * enrollment number, and decode the college/branch/batch from the number.
 *
 * We never trust the client for these values — the enrollment is parsed
 * server-side and the name comes straight from RGPV.
 */
export async function previewEnrollment(
  enrollment: string,
  semester: number,
): Promise<EnrollmentPreview> {
  const parsed = parseEnrollment(enrollment);
  if (!parsed) return { ok: false, error: 'That does not look like a valid enrollment number.' };

  try {
    const result = await fetchResult(parsed.raw, semester);
    return {
      ok: true,
      name: result.name,
      college: parsed.collegeCode,
      branch: parsed.branchName,
      batch: parsed.graduatingBatch,
    };
  } catch (error) {
    if (error instanceof ResultWorkerError && error.notFound) {
      return { ok: false, error: 'No result found for that enrollment and semester.' };
    }
    return { ok: false, error: 'Could not reach the result service. Please try again.' };
  }
}

/** Step 2 of verification: bind the (confirmed) enrollment to the current user. */
export async function confirmEnrollment(enrollment: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'You must be signed in.' };

  const parsed = parseEnrollment(enrollment);
  if (!parsed) return { ok: false, error: 'Invalid enrollment number.' };

  // Reject if another account already claimed this enrollment.
  const existing = await prisma.user.findUnique({
    where: { enrollmentNumber: parsed.raw },
    select: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return { ok: false, error: 'This enrollment is already linked to another account.' };
  }

  // Ensure the college exists (the catalogue may not list every affiliated college).
  const college = await prisma.college.upsert({
    where: { code: parsed.collegeCode },
    update: {},
    create: { code: parsed.collegeCode, name: `College ${parsed.collegeCode}`, city: 'Bhopal' },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      enrollmentNumber: parsed.raw,
      verificationStatus: 'VERIFIED',
      collegeId: college.id,
      branchCode: parsed.branchCode,
      admissionYear: parsed.admissionYear,
      graduatingBatch: parsed.graduatingBatch,
    },
  });

  revalidatePath('/', 'layout');
  return { ok: true };
}
