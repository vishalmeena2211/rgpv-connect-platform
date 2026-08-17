/**
 * RGPV's 10-point absolute grading scale. Grade points feed the SGPA/CGPA
 * calculators. Ordered best-to-worst for dropdown display.
 */
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

/** A credit-weighted entry used by both the SGPA and CGPA calculators. */
export interface WeightedEntry {
  /** Credits for a subject (SGPA) or total credits for a semester (CGPA). */
  credits: number;
  /** Grade points: a fixed grade (SGPA) or an entered SGPA/CGPA (CGPA). */
  points: number;
}

/**
 * Credit-weighted average of grade points, rounded to two decimals. Returns 0
 * when there are no credits, so callers can guard on an empty form.
 */
export function weightedAverage(entries: WeightedEntry[]): number {
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = entries.reduce((sum, entry) => sum + entry.credits * entry.points, 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}
