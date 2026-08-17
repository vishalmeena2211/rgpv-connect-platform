'use server';

import { revalidatePath } from 'next/cache';
import { type Prisma, prisma } from '@rgpv/db';
import { type ResultStatus, type SemesterResult } from '@rgpv/shared';

import { auth } from '@/auth';
import { fetchResult, ResultWorkerError } from '@/lib/result-worker';

/** A cached semester result with its denormalised metadata, ready to render. */
export interface SavedResult {
  semester: number;
  status: ResultStatus;
  sgpa: number | null;
  cgpa: number | null;
  fetchedAt: string;
  payload: SemesterResult;
}

/** Outcome of a sync run: how many semesters were fetched vs. not found. */
export interface SyncSummary {
  ok: boolean;
  fetched: number;
  notFound: number;
  error?: string;
}

const MAX_SEMESTER = 8;

/**
 * Fetch every available semester result for the signed-in (verified) user from
 * the worker and upsert them into `ResultRecord`. Semesters that return a
 * "not found" are skipped (the student may not have reached them yet); any
 * other worker error aborts the run.
 */
export async function syncMyResults(): Promise<SyncSummary> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, fetched: 0, notFound: 0, error: 'You must be signed in.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { enrollmentNumber: true, verificationStatus: true },
  });

  if (!user?.enrollmentNumber || user.verificationStatus !== 'VERIFIED') {
    return {
      ok: false,
      fetched: 0,
      notFound: 0,
      error: 'Verify your enrollment number first to sync your results.',
    };
  }

  let fetched = 0;
  let notFound = 0;

  for (let semester = 1; semester <= MAX_SEMESTER; semester += 1) {
    try {
      const result = await fetchResult(user.enrollmentNumber, semester);
      const payload = result as unknown as Prisma.InputJsonValue;
      await prisma.resultRecord.upsert({
        where: { userId_semester: { userId: session.user.id, semester } },
        update: {
          status: result.status,
          sgpa: result.sgpa ?? null,
          cgpa: result.cgpa ?? null,
          payload,
          fetchedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          semester,
          status: result.status,
          sgpa: result.sgpa ?? null,
          cgpa: result.cgpa ?? null,
          payload,
        },
      });
      fetched += 1;
    } catch (error) {
      if (error instanceof ResultWorkerError && error.notFound) {
        notFound += 1;
        continue;
      }
      return {
        ok: false,
        fetched,
        notFound,
        error: error instanceof Error ? error.message : 'Sync failed. Please try again.',
      };
    }
  }

  revalidatePath('/results/me');
  return { ok: true, fetched, notFound };
}

/** Load all cached results for the signed-in user, ordered by semester. */
export async function getMyResults(): Promise<SavedResult[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const records = await prisma.resultRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { semester: 'asc' },
  });

  return records.map((record) => ({
    semester: record.semester,
    status: record.status,
    sgpa: record.sgpa,
    cgpa: record.cgpa,
    fetchedAt: record.fetchedAt.toISOString(),
    payload: record.payload as unknown as SemesterResult,
  }));
}
