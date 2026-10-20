import { z } from 'zod';

import { isValidEnrollment } from '../enrollment/parser';

/** Reusable enrollment field with format validation. */
const enrollmentField = z
  .string()
  .trim()
  .refine(isValidEnrollment, { message: 'Invalid RGPV enrollment number' });

const semesterField = z.coerce.number().int().min(1).max(10);

/** Request body for fetching a single student's result. */
export const singleResultRequestSchema = z.object({
  enrollment: enrollmentField,
  semester: semesterField,
});
export type SingleResultRequest = z.infer<typeof singleResultRequestSchema>;

/** Request body for fetching a contiguous range of results. */
export const bulkResultRequestSchema = z
  .object({
    firstEnrollment: enrollmentField,
    lastEnrollment: enrollmentField,
    semester: semesterField,
  })
  .refine((v) => v.firstEnrollment !== v.lastEnrollment, {
    message: 'Range endpoints must differ; use the single endpoint instead',
    path: ['lastEnrollment'],
  });
export type BulkResultRequest = z.infer<typeof bulkResultRequestSchema>;

/** Schema describing one subject row (validates worker output defensively). */
export const subjectResultSchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  totalMarks: z.number().optional(),
  earnedMarks: z.number().optional(),
  grade: z.string().optional(),
});

export const resultStatusSchema = z.enum(['PASS', 'FAIL', 'WITHHELD', 'UNKNOWN']);

type ResultStatusValue = z.infer<typeof resultStatusSchema>;

/**
 * The status RGPV declared, recovered when the header cell did not say.
 *
 * The worker reads pass/fail from one fixed line of RGPV's header table, and on
 * some result pages that line holds something else. The summary line
 * (`resultDescription`) and the grades say the same thing, so fall back to
 * them: any F grade is a fail, a full set of passing grades is a pass.
 */
export function resolveResultStatus(result: {
  status: ResultStatusValue;
  resultDescription?: string;
  subjects: { grade?: string }[];
}): ResultStatusValue {
  if (result.status !== 'UNKNOWN') return result.status;
  const note = (result.resultDescription ?? '').toUpperCase();
  if (note.includes('WITHHELD')) return 'WITHHELD';
  if (note.includes('FAIL')) return 'FAIL';
  if (note.includes('PASS')) return 'PASS';
  const grades = result.subjects.map((subject) => subject.grade?.trim().toUpperCase() ?? '');
  if (grades.length === 0 || grades.some((grade) => grade === '')) return 'UNKNOWN';
  if (grades.some((grade) => grade.startsWith('F'))) return 'FAIL';
  return grades.every((grade) => /^(A\+|A|B\+|B|C\+|C|D)$/.test(grade)) ? 'PASS' : 'UNKNOWN';
}

/** Schema for a parsed semester result. Results cached before the status fix are repaired on read. */
export const semesterResultSchema = z.object({
  name: z.string(),
  enrollment: z.string(),
  session: z.string().optional(),
  course: z.string().optional(),
  branch: z.string().optional(),
  semester: z.number().int(),
  status: resultStatusSchema,
  subjects: z.array(subjectResultSchema),
  resultDescription: z.string().optional(),
  sgpa: z.number().optional(),
  cgpa: z.number().optional(),
  candidateStatus: z.string().optional(),
  revaluationDate: z.string().optional(),
  revaluationLateFeeDate: z.string().optional(),
}).transform((result) => ({ ...result, status: resolveResultStatus(result) }));
