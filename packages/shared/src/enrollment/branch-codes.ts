/**
 * Map of RGPV branch codes (the two-letter segment of an enrollment number)
 * to human-readable branch names.
 *
 * RGPV enrollment numbers embed the branch as a two-letter code, e.g. the `BT`
 * in `0751BT16012`. This list covers the common engineering branches; unknown
 * codes are handled gracefully by the parser (it keeps the raw code).
 */
export const BRANCH_CODES = {
  CS: 'Computer Science & Engineering',
  IT: 'Information Technology',
  EC: 'Electronics & Communication Engineering',
  EX: 'Electrical & Electronics Engineering',
  EE: 'Electrical Engineering',
  ME: 'Mechanical Engineering',
  CE: 'Civil Engineering',
  BT: 'Biotechnology',
  CM: 'Chemical Engineering',
  AU: 'Automobile Engineering',
  AI: 'Artificial Intelligence',
  DS: 'Computer Science (Data Science)',
  IO: 'Computer Science (IoT)',
  CB: 'Computer Science & Business Systems',
  MN: 'Mining Engineering',
  PE: 'Petrochemical Engineering',
  FT: 'Fire Technology & Safety',
} as const satisfies Record<string, string>;

export type BranchCode = keyof typeof BRANCH_CODES;

/** Returns the readable branch name for a code, or the raw code if unknown. */
export function branchName(code: string): string {
  return BRANCH_CODES[code.toUpperCase() as BranchCode] ?? code.toUpperCase();
}

/** Type guard for known branch codes. */
export function isKnownBranchCode(code: string): code is BranchCode {
  return code.toUpperCase() in BRANCH_CODES;
}
