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

/** Outcome of a sync run: how many semesters were fetched, skipped or missing. */
export interface SyncSummary {
  ok: boolean;
  fetched: number;
  notFound: number;
  /** Semesters served from cache because their result can no longer change. */
  skipped: number;
  error?: string;
}

const MAX_SEMESTER = 8;

/**
 * How many semesters to fetch concurrently.
 *
 * Each fetch costs the worker an RGPV handshake plus a paid captcha solve, so
 * this is deliberately modest: enough to stay well inside a serverless function
 * budget, low enough that we don't hammer the RGPV portal on results day.
 */
const FETCH_CONCURRENCY = 4;

/**
 * A published semester result is immutable — once RGPV declares a pass or fail
 * it never changes. Anything else (withheld, unknown) is still in flux and is
 * worth re-fetching on the next sync.
 */
const FINAL_STATUSES: ReadonlySet<ResultStatus> = new Set<ResultStatus>(['PASS', 'FAIL']);

/**
 * Highest semester a student could plausibly have sat, from their admission
 * year (two semesters per academic year, plus one for the in-progress term).
 *
 * Without this a first-year student would re-request semesters 3–8 on every
 * sync just to be told "not found" — six wasted scrapes and captcha solves.
 */
function plausibleMaxSemester(admissionYear: number | null): number {
  if (!admissionYear) return MAX_SEMESTER;
  const yearsElapsed = new Date().getFullYear() - admissionYear;
  if (yearsElapsed < 0) return 1;
  return Math.min(MAX_SEMESTER, Math.max(1, yearsElapsed * 2 + 1));
}

/** Run `task` over `items`, at most `limit` at a time, preserving input order. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(items[index]!);
    }
  });

  await Promise.all(workers);
  return results;
}

/** Outcome of fetching one semester. */
type SemesterOutcome =
  | { kind: 'fetched'; semester: number; result: SemesterResult }
  | { kind: 'notFound' }
  | { kind: 'error'; message: string };

/**
 * Fetch every semester result the signed-in (verified) user could have and
 * upsert them into `ResultRecord`.
 *
 * Only semesters that actually need work are requested: those with no cached
 * record, or whose cached status isn't final yet. Semesters already recorded as
 * PASS/FAIL are skipped entirely, so a repeat sync is typically free. Pass
 * `force` to re-fetch everything (e.g. after a revaluation).
 */
export async function syncMyResults(options?: { force?: boolean }): Promise<SyncSummary> {
  const force = options?.force ?? false;
  const empty = { fetched: 0, notFound: 0, skipped: 0 };

  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, ...empty, error: 'You must be signed in.' };
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { enrollmentNumber: true, verificationStatus: true, admissionYear: true },
  });

  if (!user?.enrollmentNumber || user.verificationStatus !== 'VERIFIED') {
    return {
      ok: false,
      ...empty,
      error: 'Verify your enrollment number first to sync your results.',
    };
  }
  const enrollmentNumber = user.enrollmentNumber;

  const existing = await prisma.resultRecord.findMany({
    where: { userId },
    select: { semester: true, status: true },
  });
  const finalSemesters = new Set(
    existing.filter((record) => FINAL_STATUSES.has(record.status)).map((r) => r.semester),
  );

  const upperBound = plausibleMaxSemester(user.admissionYear);
  const candidates = Array.from({ length: upperBound }, (_, i) => i + 1);
  const pending = force ? candidates : candidates.filter((s) => !finalSemesters.has(s));
  const skipped = candidates.length - pending.length;

  if (pending.length === 0) {
    return { ok: true, ...empty, skipped };
  }

  const outcomes = await mapWithConcurrency(
    pending,
    FETCH_CONCURRENCY,
    async (semester): Promise<SemesterOutcome> => {
      try {
        return { kind: 'fetched', semester, result: await fetchResult(enrollmentNumber, semester) };
      } catch (error) {
        if (error instanceof ResultWorkerError && error.notFound) {
          return { kind: 'notFound' };
        }
        return {
          kind: 'error',
          message: error instanceof Error ? error.message : 'Sync failed. Please try again.',
        };
      }
    },
  );

  const fetchedResults = outcomes.filter((o) => o.kind === 'fetched');
  const notFound = outcomes.filter((o) => o.kind === 'notFound').length;
  const firstError = outcomes.find((o) => o.kind === 'error');

  // Persist whatever succeeded, even if a sibling semester failed — a partial
  // sync is still progress, and the next run only retries what's missing.
  if (fetchedResults.length > 0) {
    await prisma.$transaction(
      fetchedResults.map(({ semester, result }) => {
        const payload = result as unknown as Prisma.InputJsonValue;
        const fields = {
          status: result.status,
          sgpa: result.sgpa ?? null,
          cgpa: result.cgpa ?? null,
          payload,
        };
        return prisma.resultRecord.upsert({
          where: { userId_semester: { userId, semester } },
          update: { ...fields, fetchedAt: new Date() },
          create: { userId, semester, ...fields },
        });
      }),
    );
    revalidatePath('/results/me');
  }

  const summary = { fetched: fetchedResults.length, notFound, skipped };
  return firstError ? { ok: false, ...summary, error: firstError.message } : { ok: true, ...summary };
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
