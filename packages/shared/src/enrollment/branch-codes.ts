/**
 * Map of RGPV branch codes (the two-letter segment of an enrollment number)
 * to human-readable branch names.
 *
 * RGPV enrollment numbers embed the branch as a two-letter code, e.g. the `BT`
 * in `0751BT16012`. This list covers the common engineering branches; unknown
 * codes are handled gracefully by the parser (it keeps the raw code).
 */
export const BRANCH_CODES = {
  // Names as RGPV's first-year scheme lists them (w.e.f. July 2022), Group A then Group B.
  AB: 'Automation and Robotics',
  RM: 'Robotics and Mechatronics',
  AN: 'Agriculture Engineering',
  AT: 'Agriculture Technology',
  CS: 'Computer Science & Engineering',
  EE: 'Electrical Engineering',
  EI: 'Electronics & Instrumentation Engineering',
  EV: 'Electric Vehicles',
  EX: 'Electrical & Electronics Engineering',
  IE: 'Applied Electronics & Instrumentation Engineering',
  IT: 'Information Technology',
  MI: 'Mining Engineering',
  MM: 'Mining and Mineral Processing',
  AG: '3D Animation & Graphics',
  SD: 'Computer Science & Design',
  CO: 'Computer Engineering',
  PC: 'Petrochemical Engineering',
  AD: 'Artificial Intelligence and Data Science',
  AL: 'CSE (Artificial Intelligence and Machine Learning)',
  CL: 'Artificial Intelligence and Machine Learning',
  AU: 'Automobile Engineering',
  BM: 'Biomedical Engineering',
  CE: 'Civil Engineering',
  CI: 'Computer Science & Information Technology',
  CM: 'Chemical Engineering',
  DS: 'Data Science',
  EC: 'Electronics & Communication Engineering',
  FT: 'Fire Technology & Safety Engineering',
  IO: 'CSE (Internet of Things)',
  IP: 'Industrial Production Engineering',
  IS: 'CSE (IoT and Cyber Security including Block Chain Technology)',
  ME: 'Mechanical Engineering',
  RA: 'Robotics and Artificial Intelligence',
  CY: 'CSE (Cyber Security)',
  CN: 'Cyber Security',
  CD: 'CSE (Data Science)',
  AI: 'Artificial Intelligence',
  IA: 'CSE (Artificial Intelligence)',
  // Codes seen outside that list (other schemes or older batches).
  BT: 'Biotechnology',
  CB: 'Computer Science & Business Systems',
  MN: 'Mining Engineering',
  PE: 'Petrochemical Engineering',
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
