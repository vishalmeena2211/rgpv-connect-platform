/**
 * Domain types for RGPV exam results.
 *
 * These mirror the shape returned by the `result-worker` service so the web app
 * and the worker share a single source of truth for the result contract.
 */

/** A single subject row within a semester result. */
export interface SubjectResult {
  /** Subject name as printed by RGPV, e.g. "ENGINEERING MATHEMATICS". */
  name: string;
  /** Subject code, when available. */
  code?: string;
  /** Maximum/total marks for the subject. */
  totalMarks?: number;
  /** Marks earned by the student. */
  earnedMarks?: number;
  /** Grade letter, e.g. "A", "B+". */
  grade?: string;
}

/** Final outcome of a semester result. */
export type ResultStatus = 'PASS' | 'FAIL' | 'WITHHELD' | 'UNKNOWN';

/** A parsed semester result for a single student. */
export interface SemesterResult {
  /** Student full name as printed by RGPV. */
  name: string;
  /** Enrollment number this result belongs to. */
  enrollment: string;
  /** Exam session label, e.g. "Dec 2023". */
  session?: string;
  /** Course, e.g. "Bachelor of Technology". */
  course?: string;
  /** Branch name, e.g. "Computer Science & Engineering". */
  branch?: string;
  /** Semester number (1-8 for B.Tech). */
  semester: number;
  /** Overall pass/fail status. */
  status: ResultStatus;
  /** Per-subject breakdown. */
  subjects: SubjectResult[];
  /** Free-text result description from RGPV (back-paper notes etc.). */
  resultDescription?: string;
  /** Semester grade point average. */
  sgpa?: number;
  /** Cumulative grade point average. */
  cgpa?: number;
}

/** Maps an enrollment number to its result (used by the bulk endpoint). */
export type BulkResultMap = Record<string, SemesterResult>;
