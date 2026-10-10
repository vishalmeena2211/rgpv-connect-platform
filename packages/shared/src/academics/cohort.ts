/**
 * Cohort maths: where a student stands in their branch + batch, and how close
 * a batch is to being useful as a network.
 */

/** A percentile is only shown for cohorts at least this big, so nobody can be singled out. */
export const MIN_COHORT_FOR_RANK = 20;

/** A batch becomes worth opening to the network at about a third verified. */
export const DENSITY_THRESHOLD = 1 / 3;

/**
 * "Top N%" position of `value` among `cohort` (which includes `value`).
 * Ties share the better position. Returns null for cohorts too small to rank.
 *
 * Example: 7th best of 38 → top 18%.
 */
export function topPercent(value: number, cohort: readonly number[]): number | null {
  if (cohort.length < MIN_COHORT_FOR_RANK) return null;
  const better = cohort.filter((other) => other > value).length;
  const rank = better + 1;
  return Math.max(1, Math.ceil((rank / cohort.length) * 100));
}

/** 1-based rank of `value` among `cohort`, ties sharing the better rank. */
export function rankOf(value: number, cohort: readonly number[]): number {
  return cohort.filter((other) => other > value).length + 1;
}

/** How far a batch is from the density target. */
export interface Density {
  verified: number;
  size: number | null;
  /** Share of the batch that is verified, 0–1, or null when the size is unknown. */
  ratio: number | null;
  /** True once the batch passes the threshold; the invite callout then hides. */
  reached: boolean;
}

export function density(verified: number, size: number | null | undefined): Density {
  if (!size || size <= 0) return { verified, size: null, ratio: null, reached: false };
  const ratio = Math.min(1, verified / size);
  return { verified, size, ratio, reached: ratio >= DENSITY_THRESHOLD };
}
