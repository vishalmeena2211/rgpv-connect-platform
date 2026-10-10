/**
 * RGPV's academic calendar, as far as results are concerned.
 *
 * A B.Tech student admitted in year A studies:
 *
 * | Semester | Term          | Exams        | Result usually declared |
 * | -------- | ------------- | ------------ | ----------------------- |
 * | odd  k   | Jul–Dec       | Nov–Dec      | Jan–Feb of the next year |
 * | even k   | Jan–Jun       | May–Jun      | Jul–Aug of the same year |
 *
 * where semester 1 is Jul–Dec of year A, semester 2 is Jan–Jun of A+1, and so
 * on. These are rules of thumb from the knowledge doc; the portal is the only
 * real source of truth, so callers use them for defaults and copy, never to
 * refuse a lookup.
 */

/** Number of semesters in a B.Tech. */
export const COURSE_SEMESTERS = 8;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** When a semester's exams happen and when its result usually appears. */
export interface SemesterSchedule {
  semester: number;
  isOdd: boolean;
  /** e.g. "Nov to Dec 2026". */
  examWindow: string;
  /** e.g. "Jan to Feb 2027". */
  declareWindow: string;
  /** First day exams are over, i.e. the day after the exam window closes. */
  examsOverOn: Date;
  /** First day the result is very likely to be out (end of the declare window). */
  likelyDeclaredBy: Date;
}

/** The calendar year a semester's term falls in. */
function termYear(semester: number, admissionYear: number): number {
  return semester % 2 === 1
    ? admissionYear + (semester - 1) / 2
    : admissionYear + semester / 2;
}

/** Exam and declaration windows for one semester of a batch. */
export function semesterSchedule(semester: number, admissionYear: number): SemesterSchedule {
  const isOdd = semester % 2 === 1;
  const year = termYear(semester, admissionYear);

  if (isOdd) {
    return {
      semester,
      isOdd,
      examWindow: `Nov to Dec ${year}`,
      declareWindow: `Jan to Feb ${year + 1}`,
      examsOverOn: new Date(Date.UTC(year + 1, 0, 1)),
      likelyDeclaredBy: new Date(Date.UTC(year + 1, 2, 1)),
    };
  }
  return {
    semester,
    isOdd,
    examWindow: `May to Jun ${year}`,
    declareWindow: `Jul to Aug ${year}`,
    examsOverOn: new Date(Date.UTC(year, 6, 1)),
    likelyDeclaredBy: new Date(Date.UTC(year, 8, 1)),
  };
}

/** Semesters whose exams are over by `now` (capped at the course length). */
export function completedSemesters(admissionYear: number, now: Date = new Date()): number {
  let completed = 0;
  for (let semester = 1; semester <= COURSE_SEMESTERS; semester += 1) {
    if (now >= semesterSchedule(semester, admissionYear).examsOverOn) completed = semester;
    else break;
  }
  return completed;
}

/** The semester a student is studying now, or the last one once the course is over. */
export function currentSemester(admissionYear: number, now: Date = new Date()): number {
  return Math.min(COURSE_SEMESTERS, completedSemesters(admissionYear, now) + 1);
}

/**
 * The highest semester whose result is very likely out by `now`, or null if
 * none is. Used as the default semester for a lookup.
 */
export function latestDeclaredSemester(
  admissionYear: number,
  now: Date = new Date(),
): number | null {
  let latest: number | null = null;
  for (let semester = 1; semester <= COURSE_SEMESTERS; semester += 1) {
    if (now >= semesterSchedule(semester, admissionYear).likelyDeclaredBy) latest = semester;
    else break;
  }
  return latest;
}

/**
 * Highest semester worth asking the portal about: every semester whose exams
 * are over, since a result can appear before the end of its usual window.
 */
export function plausibleMaxSemester(admissionYear: number | null, now: Date = new Date()): number {
  if (!admissionYear) return COURSE_SEMESTERS;
  return Math.max(1, completedSemesters(admissionYear, now));
}

/** "Jun 2025" style label from a date. */
export function monthYear(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Ordinal year of study for a semester: 1–2 → 1, 3–4 → 2, … */
export function yearOfStudy(semester: number): number {
  return Math.ceil(semester / 2);
}
