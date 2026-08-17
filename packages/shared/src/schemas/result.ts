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

/** Schema for a parsed semester result. */
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
});
