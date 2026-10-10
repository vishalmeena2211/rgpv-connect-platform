import 'server-only';

import { type Prisma, prisma } from '@rgpv/db';
import {
  type ResultStatus,
  type SemesterResult,
  plausibleMaxSemester,
  semesterResultSchema,
  topPercent,
  MIN_COHORT_FOR_RANK,
} from '@rgpv/shared';

import type { CurrentUser } from '@/lib/session';

/** A saved semester result with its denormalised metadata, ready to render. */
export interface SavedResult {
  semester: number;
  status: ResultStatus;
  sgpa: number | null;
  cgpa: number | null;
  fetchedAt: string;
  payload: SemesterResult | null;
}

/** A semester result is final once RGPV declares pass or fail. */
export const FINAL_STATUSES: ReadonlySet<ResultStatus> = new Set<ResultStatus>(['PASS', 'FAIL']);

export function parseResultPayload(payload: Prisma.JsonValue | null): SemesterResult | null {
  const parsed = semesterResultSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

/** All saved results for a user, oldest semester first. */
export async function getSavedResults(userId: string): Promise<SavedResult[]> {
  const records = await prisma.resultRecord.findMany({ where: { userId }, orderBy: { semester: 'asc' } });
  return records.map((record) => ({
    semester: record.semester,
    status: record.status,
    sgpa: record.sgpa,
    cgpa: record.cgpa,
    fetchedAt: record.fetchedAt.toISOString(),
    payload: parseResultPayload(record.payload),
  }));
}

/** Which semesters a sync should ask the portal about. */
export interface SyncPlan {
  /** Every semester whose exams are over for this batch. */
  candidates: number[];
  /** Those without a final saved result. */
  pending: number[];
}

export function syncPlan(admissionYear: number | null, saved: SavedResult[]): SyncPlan {
  const max = plausibleMaxSemester(admissionYear);
  const candidates = Array.from({ length: max }, (_, i) => i + 1);
  const final = new Set(saved.filter((r) => FINAL_STATUSES.has(r.status)).map((r) => r.semester));
  return { candidates, pending: candidates.filter((s) => !final.has(s)) };
}

/** Where the user's latest CGPA sits in their branch + batch at their college. */
export interface Standing {
  semester: number;
  cohortSize: number;
  topPercent: number | null;
  /** Students with a result for this semester, out of the verified cohort. */
  withResults: number;
}

function cohortWhere(user: CurrentUser): Prisma.UserWhereInput | null {
  if (!user.collegeId || !user.branchCode || !user.graduatingBatch) return null;
  return {
    verificationStatus: 'VERIFIED',
    collegeId: user.collegeId,
    branchCode: user.branchCode,
    graduatingBatch: user.graduatingBatch,
  };
}

/**
 * The viewer's percentile among verified batchmates on CGPA after the
 * viewer's latest semester. Aggregate only: no other student is identified,
 * and cohorts under MIN_COHORT_FOR_RANK get no percentile at all.
 */
export async function getStanding(user: CurrentUser, latest: SavedResult | undefined): Promise<Standing | null> {
  const where = cohortWhere(user);
  if (!where || !latest || latest.cgpa == null) return null;

  const [cohortSize, records] = await Promise.all([
    prisma.user.count({ where }),
    prisma.resultRecord.findMany({
      where: { semester: latest.semester, cgpa: { not: null }, user: where },
      select: { cgpa: true },
    }),
  ]);
  const values = records.map((r) => r.cgpa as number);
  return {
    semester: latest.semester,
    cohortSize,
    withResults: values.length,
    topPercent: values.length >= MIN_COHORT_FOR_RANK ? topPercent(latest.cgpa, values) : null,
  };
}

export interface BoardRow {
  rank: number;
  userId: string;
  name: string;
  sgpa: number;
  cgpa: number | null;
  isViewer: boolean;
}

/**
 * The opt-in semester board for the viewer's cohort: only students who turned
 * on "show me on the board" appear. Ranks are among those listed.
 */
export async function getBoard(
  user: CurrentUser,
  semester: number,
  limit = 10,
): Promise<{ rows: BoardRow[]; total: number; viewerRow: BoardRow | null }> {
  const where = cohortWhere(user);
  if (!where) return { rows: [], total: 0, viewerRow: null };
  const records = await prisma.resultRecord.findMany({
    where: { semester, sgpa: { not: null }, user: { ...where, showOnBoard: true } },
    orderBy: [{ sgpa: 'desc' }, { cgpa: 'desc' }],
    select: { sgpa: true, cgpa: true, user: { select: { id: true, name: true } } },
  });
  const all: BoardRow[] = [];
  let previous: number | null = null;
  records.forEach((record, index) => {
    const sgpa = record.sgpa as number;
    const rank = previous === sgpa ? all[index - 1]!.rank : index + 1;
    previous = sgpa;
    all.push({ rank, userId: record.user.id, name: record.user.name, sgpa, cgpa: record.cgpa, isViewer: record.user.id === user.id });
  });
  const rows = all.slice(0, limit);
  const viewerRow = all.find((row) => row.isViewer) ?? null;
  return { rows, total: all.length, viewerRow: viewerRow && !rows.includes(viewerRow) ? viewerRow : null };
}

/** Verified batchmates with a result for `semester`, out of the cohort, for the results-day tile. */
export async function getCohortProgress(user: CurrentUser, semester: number): Promise<{ withResult: number; cohort: number } | null> {
  const where = cohortWhere(user);
  if (!where) return null;
  const [cohort, withResult] = await Promise.all([
    prisma.user.count({ where }),
    prisma.resultRecord.count({ where: { semester, user: where } }),
  ]);
  return { cohort, withResult };
}

/** Subject credits for a semester of the user's branch, keyed by subject code. */
export async function getCredits(branchCode: string | null, semester: number): Promise<Map<string, number>> {
  if (!branchCode) return new Map();
  const subjects = await prisma.subject.findMany({
    where: { semester: { number: semester, branch: { code: branchCode } }, credits: { not: null } },
    select: { code: true, credits: true },
  });
  return new Map(subjects.flatMap((s) => (s.code && s.credits ? [[s.code, s.credits] as const] : [])));
}

/** The catalogue subjects for a semester of a branch, for the calculator. */
export async function getSemesterSubjects(branchCode: string | null, semester: number) {
  if (!branchCode) return [];
  return prisma.subject.findMany({
    where: { semester: { number: semester, branch: { code: branchCode } } },
    orderBy: { code: 'asc' },
    select: { code: true, name: true, credits: true },
  });
}
