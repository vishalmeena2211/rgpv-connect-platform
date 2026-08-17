import { branchName, isKnownBranchCode } from './branch-codes';

/**
 * Structured representation of an RGPV enrollment number.
 *
 * RGPV enrollment numbers follow the shape `CCCCBBYYNNN`, e.g. `0751BT16012`:
 *
 * | Segment        | Example | Meaning                                   |
 * | -------------- | ------- | ----------------------------------------- |
 * | College code   | `0751`  | 4-digit affiliated-college identifier     |
 * | Branch code    | `BT`    | 2-letter branch (see {@link BRANCH_CODES})|
 * | Admission year | `16`    | last two digits of the admission year     |
 * | Serial number  | `012`   | student roll within the college/branch    |
 *
 * The embedded college / branch / year is exactly what lets RGPV Connect
 * auto-group students after enrollment verification — no manual selection.
 */
export interface ParsedEnrollment {
  /** Normalised (uppercased, trimmed) enrollment number. */
  raw: string;
  /** 4-digit affiliated-college code, e.g. `"0751"`. */
  collegeCode: string;
  /** 2-letter branch code, e.g. `"BT"`. */
  branchCode: string;
  /** Human-readable branch name, e.g. `"Biotechnology"`. */
  branchName: string;
  /** Full 4-digit admission year, e.g. `2016`. */
  admissionYear: number;
  /** Expected graduating batch year (admission + 4 for a B.Tech). */
  graduatingBatch: number;
  /** Student serial number within the college/branch, e.g. `"012"`. */
  serial: string;
  /** Whether the branch code is one we recognise. */
  isKnownBranch: boolean;
}

/** Canonical RGPV enrollment pattern: 4 digits, 2 letters, 2 digits, 3 digits. */
const ENROLLMENT_PATTERN = /^(\d{4})([A-Z]{2})(\d{2})(\d{3})$/;

/** Course length in years, used to derive the graduating batch from admission year. */
const DEFAULT_COURSE_YEARS = 4;

/**
 * Normalises raw user input into the canonical enrollment form:
 * trims whitespace, removes spaces/hyphens, and uppercases.
 */
export function normaliseEnrollment(input: string): string {
  return input.trim().replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Resolves a 2-digit admission year into a full year.
 *
 * RGPV enrollment numbers only encode two digits. We assume the 21st century
 * for values that would otherwise place the student implausibly far in the
 * future relative to {@link referenceYear}.
 */
function resolveAdmissionYear(twoDigit: number, referenceYear: number): number {
  const century = Math.floor(referenceYear / 100) * 100;
  const candidate = century + twoDigit;
  // If the candidate is in the future, it belongs to the previous century.
  return candidate > referenceYear ? candidate - 100 : candidate;
}

/**
 * Parses an RGPV enrollment number into its structured parts.
 *
 * @param input Raw enrollment string (any casing/spacing is tolerated).
 * @param referenceYear Year used to disambiguate the 2-digit admission year.
 *   Defaults to the current year. Injectable for deterministic tests.
 * @returns The parsed enrollment, or `null` if the input is not a valid format.
 */
export function parseEnrollment(
  input: string,
  referenceYear: number = new Date().getFullYear(),
): ParsedEnrollment | null {
  const raw = normaliseEnrollment(input);
  const match = ENROLLMENT_PATTERN.exec(raw);
  if (!match) return null;

  const [, collegeCode, branchCode, yearDigits, serial] = match as unknown as [
    string,
    string,
    string,
    string,
    string,
  ];

  const admissionYear = resolveAdmissionYear(Number(yearDigits), referenceYear);

  return {
    raw,
    collegeCode,
    branchCode,
    branchName: branchName(branchCode),
    admissionYear,
    graduatingBatch: admissionYear + DEFAULT_COURSE_YEARS,
    serial,
    isKnownBranch: isKnownBranchCode(branchCode),
  };
}

/** Lightweight validity check without allocating a parsed object. */
export function isValidEnrollment(input: string): boolean {
  return ENROLLMENT_PATTERN.test(normaliseEnrollment(input));
}

/**
 * Expands an inclusive enrollment range into the full list of enrollment
 * numbers, used by the bulk-result feature.
 *
 * Both endpoints must share the same college code, branch code and admission
 * year; only the serial differs. Returns an empty array on mismatch or when
 * the range is reversed/oversized.
 *
 * @param maxCount Safety cap on the number of generated enrollments.
 */
export function expandEnrollmentRange(
  first: string,
  last: string,
  maxCount = 500,
): string[] {
  const start = parseEnrollment(first);
  const end = parseEnrollment(last);
  if (!start || !end) return [];

  const sharedPrefix =
    start.collegeCode === end.collegeCode &&
    start.branchCode === end.branchCode &&
    start.admissionYear === end.admissionYear;
  if (!sharedPrefix) return [];

  const from = Number(start.serial);
  const to = Number(end.serial);
  if (to < from || to - from + 1 > maxCount) return [];

  const prefix = start.raw.slice(0, start.raw.length - start.serial.length);
  const width = start.serial.length;

  const result: string[] = [];
  for (let serial = from; serial <= to; serial += 1) {
    result.push(`${prefix}${String(serial).padStart(width, '0')}`);
  }
  return result;
}
