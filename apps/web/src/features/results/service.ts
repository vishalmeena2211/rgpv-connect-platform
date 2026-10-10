import 'server-only';

import { type Prisma, prisma } from '@rgpv/db';
import { type SemesterResult, semesterResultSchema } from '@rgpv/shared';

import { env } from '@/lib/env';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { fetchResult, ResultWorkerError } from '@/lib/result-worker';

/** A found result is cached for six hours; results only change on revaluation. */
const FOUND_TTL_MS = 6 * 60 * 60 * 1000;
/** "Not declared" is cached briefly, so a refresh on results day still checks again. */
const NOT_FOUND_TTL_MS = 20 * 60 * 1000;

/** A result we already hold for this enrollment, shown when the portal is down. */
export interface LastKnown {
  semester: number;
  sgpa: number | null;
  cgpa: number | null;
  fetchedAt: string;
}

export type LookupOutcome =
  | { kind: 'found'; result: SemesterResult; fetchedAt: string; fromCache: boolean }
  | { kind: 'not_declared' }
  | { kind: 'unavailable'; lastKnown: LastKnown | null }
  | { kind: 'rate_limited'; retryAfterSeconds: number; lastKnown: LastKnown | null };

function parsePayload(payload: Prisma.JsonValue | null): SemesterResult | null {
  const parsed = semesterResultSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

async function lastKnown(enrollment: string): Promise<LastKnown | null> {
  const cached = await prisma.resultCache.findFirst({
    where: { enrollment, found: true },
    orderBy: [{ semester: 'desc' }, { fetchedAt: 'desc' }],
  });
  if (!cached) return null;
  return { semester: cached.semester, sgpa: cached.sgpa, cgpa: cached.cgpa, fetchedAt: cached.fetchedAt.toISOString() };
}

/** Store a fetch outcome in the public cache. */
async function remember(enrollment: string, semester: number, result: SemesterResult | null): Promise<Date> {
  const fetchedAt = new Date();
  const fields = result
    ? {
        found: true,
        status: result.status,
        sgpa: result.sgpa ?? null,
        cgpa: result.cgpa ?? null,
        payload: result as unknown as Prisma.InputJsonValue,
      }
    : { found: false, status: null, sgpa: null, cgpa: null, payload: undefined };
  await prisma.resultCache.upsert({
    where: { enrollment_semester: { enrollment, semester } },
    create: { enrollment, semester, ...fields, fetchedAt },
    update: { ...fields, fetchedAt },
  });
  return fetchedAt;
}

/**
 * Look up a result, cache first.
 *
 * - `fresh`: skip the cache (sync, results day, "Fetch again"). Still limited.
 * - `limitKey`: who to rate-limit. Defaults to the caller's hashed IP; signed-in
 *   flows pass the user id so a shared hostel connection does not lock everyone out.
 * - `limit`: false for trusted server jobs (results-day runs).
 */
export async function lookupResult(
  enrollment: string,
  semester: number,
  options: { fresh?: boolean; limitKey?: string; limit?: boolean } = {},
): Promise<LookupOutcome> {
  if (!options.fresh) {
    const cached = await prisma.resultCache.findUnique({
      where: { enrollment_semester: { enrollment, semester } },
    });
    if (cached) {
      const age = Date.now() - cached.fetchedAt.getTime();
      if (cached.found && age < FOUND_TTL_MS) {
        const result = parsePayload(cached.payload);
        if (result) return { kind: 'found', result, fetchedAt: cached.fetchedAt.toISOString(), fromCache: true };
      }
      if (!cached.found && age < NOT_FOUND_TTL_MS) return { kind: 'not_declared' };
    }
  }

  if (options.limit !== false) {
    const key = options.limitKey ?? `lookup:${await clientKey()}`;
    const check = await rateLimit(key, env.LOOKUP_LIMIT_PER_HOUR, 3600);
    if (!check.ok) {
      return { kind: 'rate_limited', retryAfterSeconds: check.retryAfterSeconds, lastKnown: await lastKnown(enrollment) };
    }
  }

  try {
    const result = await fetchResult(enrollment, semester);
    const fetchedAt = await remember(enrollment, semester, result);
    return { kind: 'found', result, fetchedAt: fetchedAt.toISOString(), fromCache: false };
  } catch (error) {
    if (error instanceof ResultWorkerError && error.notFound) {
      await remember(enrollment, semester, null);
      return { kind: 'not_declared' };
    }
    console.error('Result lookup failed', { semester, error: error instanceof Error ? error.message : error });
    return { kind: 'unavailable', lastKnown: await lastKnown(enrollment) };
  }
}
