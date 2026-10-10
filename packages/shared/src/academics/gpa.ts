/**
 * Grade-point arithmetic on RGPV's 10-point absolute scale.
 *
 * All results are rounded to two decimals, matching how RGPV prints SGPA and
 * CGPA on the result page.
 */

/** RGPV grade letters and their points, best to worst. */
export const GRADE_POINTS = {
  'A+': 10,
  A: 9,
  'B+': 8,
  B: 7,
  'C+': 6,
  C: 5,
  D: 4,
  F: 0,
} as const;

export type Grade = keyof typeof GRADE_POINTS;

export const GRADES = Object.keys(GRADE_POINTS) as Grade[];

/** Is `value` a grade letter on the scale? */
export function isGrade(value: string): value is Grade {
  return value in GRADE_POINTS;
}

/**
 * Round to two decimals the way RGPV prints grade points, half up. The epsilon
 * stops binary floats like 7.945 (stored as 7.94499…) from rounding down.
 */
export function round2(value: number): number {
  return Math.round(value * 100 + 1e-9) / 100;
}

/** A credit-weighted entry: a subject (credits + grade points) or a semester (credits + SGPA). */
export interface WeightedEntry {
  credits: number;
  points: number;
}

/**
 * Credit-weighted average of grade points, rounded to two decimals. Returns
 * null when there are no credits, so callers can show "—" instead of 0.
 */
export function weightedAverage(entries: readonly WeightedEntry[]): number | null {
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credits, 0);
  if (totalCredits <= 0) return null;
  const weighted = entries.reduce((sum, entry) => sum + entry.credits * entry.points, 0);
  return round2(weighted / totalCredits);
}

/** SGPA from subject rows of credits + grade letter. Unknown grades are skipped. */
export function sgpaFromGrades(
  rows: readonly { credits: number; grade: string }[],
): number | null {
  return weightedAverage(
    rows.flatMap((row) =>
      isGrade(row.grade) && row.credits > 0
        ? [{ credits: row.credits, points: GRADE_POINTS[row.grade] }]
        : [],
    ),
  );
}

/**
 * CGPA from semester SGPAs. Weighted by semester credits when every semester's
 * credits are known; otherwise the plain mean, which is what RGPV's own CGPA
 * comes to when semesters carry equal credits.
 */
export function cgpaFromSemesters(
  semesters: readonly { sgpa: number; credits?: number | null }[],
): number | null {
  if (semesters.length === 0) return null;
  const allCredited = semesters.every((s) => typeof s.credits === 'number' && s.credits > 0);
  if (allCredited) {
    return weightedAverage(semesters.map((s) => ({ credits: s.credits as number, points: s.sgpa })));
  }
  return round2(semesters.reduce((sum, s) => sum + s.sgpa, 0) / semesters.length);
}

/** CGPA after one more semester at `nextSgpa`, with equal semester weights. */
export function projectedCgpa(currentSgpas: readonly number[], nextSgpa: number): number {
  return round2((currentSgpas.reduce((a, b) => a + b, 0) + nextSgpa) / (currentSgpas.length + 1));
}

/** What it takes to reach a target CGPA by the end of a later semester. */
export interface TargetPlan {
  /** Average SGPA needed across the remaining semesters, rounded up to two decimals. */
  requiredAverage: number;
  /** Semesters left to reach the target. */
  remaining: number;
  /** False when the required average is above 10. */
  achievable: boolean;
  /** True when the target is already met even with zero in every remaining semester. */
  alreadyMet: boolean;
}

/**
 * The average SGPA needed over the remaining semesters to finish semester
 * `untilSemester` with `targetCgpa`, assuming equal semester weights.
 *
 * Example: SGPAs 7.42, 7.85, 8.10, 8.41 (sum 31.78), target 8.25 by
 * semester 6 → (8.25 × 6 − 31.78) ÷ 2 = 8.86.
 */
export function requiredAverageSgpa(params: {
  currentSgpas: readonly number[];
  targetCgpa: number;
  untilSemester: number;
}): TargetPlan | null {
  const done = params.currentSgpas.length;
  const remaining = params.untilSemester - done;
  if (remaining <= 0) return null;

  const needed = params.targetCgpa * params.untilSemester - params.currentSgpas.reduce((a, b) => a + b, 0);
  const average = Math.ceil((needed / remaining) * 100 - 1e-9) / 100;
  return {
    requiredAverage: Math.max(0, average),
    remaining,
    achievable: average <= 10,
    alreadyMet: needed <= 0,
  };
}
