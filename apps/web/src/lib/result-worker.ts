import 'server-only';

import { type SemesterResult, semesterResultSchema } from '@rgpv/shared';

import { env } from '@/lib/env';

/**
 * Typed client for the `result-worker` FastAPI service.
 *
 * All result fetching goes through here so callers never touch the worker URL,
 * key or response shape directly. Responses are validated with the shared zod
 * schema before being trusted.
 */

/**
 * Why a fetch failed:
 * - `not_found`: RGPV answered and has no such result (not declared yet).
 * - `portal`: the worker reached RGPV but the portal kept failing or timed out.
 * - `service`: our own result worker could not be reached or refused us
 *   (not deployed, down, wrong URL or key). RGPV was never asked.
 */
export type ResultFailure = 'not_found' | 'portal' | 'service';

/** Thrown when a result cannot be fetched. */
export class ResultWorkerError extends Error {
  constructor(
    message: string,
    readonly reason: ResultFailure,
  ) {
    super(message);
    this.name = 'ResultWorkerError';
  }

  get notFound(): boolean {
    return this.reason === 'not_found';
  }
}

/** The worker retries for up to 45 s; give it a little longer before giving up. */
const TIMEOUT_MS = 55_000;

function headers(): HeadersInit {
  return {
    'content-type': 'application/json',
    ...(env.WORKER_API_KEY ? { 'x-worker-key': env.WORKER_API_KEY } : {}),
  };
}

async function call(path: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<unknown> {
  // In production the localhost default means no worker was configured at all.
  if (process.env.NODE_ENV === 'production' && !process.env.RESULT_WORKER_URL?.trim()) {
    throw new ResultWorkerError('RESULT_WORKER_URL is not set', 'service');
  }
  let response: Response;
  try {
    response = await fetch(`${env.RESULT_WORKER_URL}${path}`, {
      ...init,
      headers: headers(),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    // A timeout means the worker took the request and was still retrying RGPV's portal.
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new ResultWorkerError('Result service timed out waiting for RGPV', 'portal');
    }
    throw new ResultWorkerError('Result service is unreachable', 'service');
  }

  if (response.status === 404) throw new ResultWorkerError('Result not found', 'not_found');
  // The worker answers 502 when RGPV's portal fails after its retries; 504 from a proxy means the same wait.
  if (response.status === 502 || response.status === 504) {
    throw new ResultWorkerError(`RGPV portal failed (${response.status})`, 'portal');
  }
  if (!response.ok) throw new ResultWorkerError(`Result service error (${response.status})`, 'service');
  return response.json();
}

const SNAKE_KEYS: Record<string, string> = {
  total_marks: 'totalMarks',
  earned_marks: 'earnedMarks',
  result_description: 'resultDescription',
  candidate_status: 'candidateStatus',
  revaluation_date: 'revaluationDate',
  revaluation_late_fee_date: 'revaluationLateFeeDate',
};

/** Accept snake_case from an older worker as well as the current camelCase. */
function camelise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelise);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [SNAKE_KEYS[key] ?? key, camelise(inner)]),
    );
  }
  return value;
}

/** Drop nulls so optional schema fields accept them. */
function dropNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(dropNulls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, inner]) => inner !== null)
        .map(([key, inner]) => [key, dropNulls(inner)]),
    );
  }
  return value;
}

/** Fetch one student's semester result from the RGPV portal (live, ~3–15 s). */
export async function fetchResult(enrollment: string, semester: number): Promise<SemesterResult> {
  const data = await call('/api/v1/result', { method: 'POST', body: JSON.stringify({ enrollment, semester }) });
  return semesterResultSchema.parse(dropNulls(camelise(data)));
}

/** Worker health, counters and captcha balance for the admin screen. */
export async function fetchWorkerStats(): Promise<unknown> {
  return call('/api/v1/stats', { method: 'GET' }, 10_000);
}

/** Ask the worker to fetch its known-good result and check it still parses. */
export async function runParserCheck(): Promise<unknown> {
  return call('/api/v1/checks/parser', { method: 'POST' });
}

/** Start (or extend) the worker's warm-session refill for the next ten minutes. */
export async function warmSessionPool(): Promise<unknown> {
  return call('/api/v1/queue/refresh', { method: 'POST' }, 10_000);
}
