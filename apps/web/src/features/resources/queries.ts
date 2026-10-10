import 'server-only';

import { prisma, type ModStatus, type ResourceType } from '@rgpv/db';
import { branchName as decodeBranch, currentSemester } from '@rgpv/shared';

/** A branch + semester pair the catalogue has subjects for. */
export interface Scope {
  branchCode: string;
  branchName: string;
  semester: number;
}

export interface SubjectOption {
  id: number;
  code: string | null;
  name: string;
  credits: number | null;
}

/** Branch codes that have a catalogue, for the scope picker. */
export async function getCatalogueBranches(): Promise<{ code: string; name: string }[]> {
  const branches = await prisma.branch.findMany({
    where: { code: { not: null } },
    distinct: ['code'],
    select: { code: true, name: true },
    orderBy: { code: 'asc' },
  });
  return branches.map((b) => ({ code: b.code as string, name: b.name }));
}

/**
 * The scope to show: the URL's when given, else the viewer's own branch and
 * current semester, else CS semester 1.
 */
export function resolveScope(
  query: { branch?: string; semester?: string },
  viewer: { branchCode: string | null; admissionYear: number | null } | null,
): Scope {
  const semester = Number(query.semester);
  const branchCode = (query.branch ?? viewer?.branchCode ?? 'CS').toUpperCase().slice(0, 2);
  const fallbackSemester = viewer?.admissionYear ? currentSemester(viewer.admissionYear) : 1;
  return {
    branchCode,
    branchName: decodeBranch(branchCode),
    semester: Number.isInteger(semester) && semester >= 1 && semester <= 8 ? semester : fallbackSemester,
  };
}

export async function getSubjects(scope: Scope): Promise<SubjectOption[]> {
  return prisma.subject.findMany({
    where: { semester: { number: scope.semester, branch: { code: scope.branchCode } } },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true, credits: true },
  });
}

export interface ResourceCard {
  id: string;
  type: ResourceType;
  title: string;
  unitName: string | null;
  session: string | null;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  pageCount: number | null;
  fileSize: number | null;
  createdAt: string;
  subject: { id: number; code: string | null; name: string };
  uploader: { id: string; name: string; branchCode: string | null; graduatingBatch: number | null; verified: boolean };
}

const cardSelect = {
  id: true,
  type: true,
  title: true,
  unitName: true,
  session: true,
  rating: true,
  ratingCount: true,
  downloadCount: true,
  pageCount: true,
  fileSize: true,
  createdAt: true,
  subject: { select: { id: true, code: true, name: true } },
  uploader: { select: { id: true, name: true, branchCode: true, graduatingBatch: true, verificationStatus: true, role: true } },
} as const;

type CardRow = Awaited<ReturnType<typeof prisma.resource.findMany<{ select: typeof cardSelect }>>>[number];

function toCard(row: CardRow): ResourceCard {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    uploader: {
      id: row.uploader.id,
      name: row.uploader.role === 'ADMIN' ? 'RGPV Connect' : row.uploader.name,
      branchCode: row.uploader.branchCode,
      graduatingBatch: row.uploader.graduatingBatch,
      verified: row.uploader.verificationStatus === 'VERIFIED',
    },
  };
}

/** Approved resources in a scope, best rated and most downloaded first. */
export async function getResources(type: ResourceType, scope: Scope, subjectId?: number): Promise<{ items: ResourceCard[]; total: number }> {
  const where = {
    type,
    status: 'APPROVED' as const,
    subject: { semester: { number: scope.semester, branch: { code: scope.branchCode } } },
    ...(subjectId ? { subjectId } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy: [{ rating: 'desc' }, { downloadCount: 'desc' }, { createdAt: 'desc' }],
      take: 40,
      select: cardSelect,
    }),
    prisma.resource.count({ where }),
  ]);
  return { items: rows.map(toCard), total };
}

/** Approved papers in a scope grouped by subject, newest exam first. */
export async function getPapersBySubject(scope: Scope): Promise<{ subject: SubjectOption; papers: ResourceCard[] }[]> {
  const [subjects, papers] = await Promise.all([
    getSubjects(scope),
    prisma.resource.findMany({
      where: { type: 'PAPER', status: 'APPROVED', subject: { semester: { number: scope.semester, branch: { code: scope.branchCode } } } },
      orderBy: { createdAt: 'desc' },
      select: cardSelect,
    }),
  ]);
  const sessionOrder = (session: string | null) => {
    if (!session) return 0;
    const [month, year] = session.split(' ');
    return Number(year) * 12 + (month === 'Dec' ? 12 : month === 'Jun' ? 6 : 0);
  };
  return subjects.map((subject) => ({
    subject,
    papers: papers
      .filter((p) => p.subject.id === subject.id)
      .map(toCard)
      .sort((a, b) => sessionOrder(b.session) - sessionOrder(a.session)),
  }));
}

/** One resource for the viewer page. Pending or rejected ones only for their uploader or an admin. */
export async function getResource(id: string, viewer: { id: string; role: string } | null) {
  const row = await prisma.resource.findUnique({
    where: { id },
    select: { ...cardSelect, status: true, pdfUrl: true, uploaderId: true, reviewNote: true, ratings: viewer ? { where: { userId: viewer.id }, select: { stars: true } } : false },
  });
  if (!row) return null;
  if (row.status !== 'APPROVED' && row.uploaderId !== viewer?.id && viewer?.role !== 'ADMIN') return null;
  return {
    ...toCard(row),
    status: row.status as ModStatus,
    pdfUrl: row.pdfUrl,
    reviewNote: row.reviewNote,
    isOwn: row.uploaderId === viewer?.id,
    myStars: Array.isArray(row.ratings) ? (row.ratings[0]?.stars ?? null) : null,
  };
}

export interface UploadRow {
  id: string;
  type: ResourceType;
  title: string;
  status: ModStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  session: string | null;
  unitName: string | null;
  subject: { id: number; code: string | null; name: string; semester: number; branchCode: string | null };
}

export async function getMyUploads(userId: string): Promise<UploadRow[]> {
  const rows = await prisma.resource.findMany({
    where: { uploaderId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      downloadCount: true,
      rating: true,
      ratingCount: true,
      session: true,
      unitName: true,
      subject: { select: { id: true, code: true, name: true, semester: { select: { number: true, branch: { select: { code: true } } } } } },
    },
  });
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    subject: { id: row.subject.id, code: row.subject.code, name: row.subject.name, semester: row.subject.semester.number, branchCode: row.subject.semester.branch.code },
  }));
}

/** Every subject in the catalogue, for the upload form's subject picker. */
export async function getAllSubjects() {
  const rows = await prisma.subject.findMany({
    orderBy: [{ semester: { number: 'asc' } }, { code: 'asc' }],
    select: { id: true, code: true, name: true, semester: { select: { number: true, branch: { select: { code: true } } } } },
  });
  return rows.map((r) => ({ id: r.id, code: r.code, name: r.name, semester: r.semester.number, branchCode: r.semester.branch.code }));
}
