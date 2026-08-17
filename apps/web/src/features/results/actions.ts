'use server';

import { type SemesterResult } from '@rgpv/shared';

import { fetchResult, ResultWorkerError } from '@/lib/result-worker';

/** Discriminated result for the lookup form. */
export type LookupResult =
  | { ok: true; result: SemesterResult }
  | { ok: false; error: string };

/** Fetch a single result for the public/lookup flow. */
export async function lookupResult(enrollment: string, semester: number): Promise<LookupResult> {
  try {
    const result = await fetchResult(enrollment, semester);
    return { ok: true, result };
  } catch (error) {
    if (error instanceof ResultWorkerError) {
      return {
        ok: false,
        error: error.notFound ? 'No result found for that enrollment and semester.' : error.message,
      };
    }
    return { ok: false, error: 'Unexpected error. Please try again.' };
  }
}
