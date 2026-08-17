import 'server-only';

import { semesterResultSchema, type SemesterResult } from '@rgpv/shared';

import { env } from '@/lib/env';

/**
 * Typed client for the `result-worker` FastAPI service.
 *
 * All result fetching goes through here so callers never touch the worker URL
 * or response shape directly. Responses are validated with the shared zod
 * schema before being trusted.
 */

/** Thrown when a result cannot be fetched. `notFound` distinguishes 404s. */
export class ResultWorkerError extends Error {
  constructor(
    message: string,
    readonly notFound = false,
  ) {
    super(message);
    this.name = 'ResultWorkerError';
  }
}

async function post(path: string, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${env.RESULT_WORKER_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new ResultWorkerError('Result service is unreachable');
  }

  if (response.status === 404) {
    throw new ResultWorkerError('Result not found', true);
  }
  if (!response.ok) {
    throw new ResultWorkerError(`Result service error (${response.status})`);
  }
  return response.json();
}

/** Fetch one student's semester result. */
export async function fetchResult(enrollment: string, semester: number): Promise<SemesterResult> {
  const data = await post('/api/v1/result', { enrollment, semester });
  return semesterResultSchema.parse(data);
}
