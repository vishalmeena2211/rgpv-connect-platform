import 'server-only';

import { prisma } from '@rgpv/db';
import { density, type Density } from '@rgpv/shared';

import type { CurrentUser } from '@/lib/session';

export type DirectoryScope = 'batch' | 'college' | 'seniors' | 'juniors';

export interface DirectoryUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  branchCode: string | null;
  graduatingBatch: number | null;
  collegeShortName: string | null;
  notesShared: number;
  isFollowing: boolean;
}

/**
 * Verified students, defaulting to the viewer's own branch + batch. University
 * scope is dropped on purpose (strategy doc: never reaches density).
 */
export async function getDirectory(
  viewer: CurrentUser,
  scope: DirectoryScope,
  search?: string,
): Promise<{ users: DirectoryUser[]; total: number }> {
  const where = {
    verificationStatus: 'VERIFIED' as const,
    id: { not: viewer.id },
    role: { not: 'ADMIN' as const },
    collegeId: viewer.collegeId ?? '__none__',
    ...(scope === 'batch' ? { branchCode: viewer.branchCode, graduatingBatch: viewer.graduatingBatch } : {}),
    ...(scope === 'seniors' && viewer.graduatingBatch ? { graduatingBatch: { lt: viewer.graduatingBatch } } : {}),
    ...(scope === 'juniors' && viewer.graduatingBatch ? { graduatingBatch: { gt: viewer.graduatingBatch } } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ resources: { _count: 'desc' } }, { name: 'asc' }],
      take: 30,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        branchCode: true,
        graduatingBatch: true,
        college: { select: { shortName: true } },
        _count: { select: { resources: { where: { status: 'APPROVED' } } } },
        followers: { where: { followerId: viewer.id }, select: { id: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    total,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      branchCode: u.branchCode,
      graduatingBatch: u.graduatingBatch,
      collegeShortName: u.college?.shortName ?? null,
      notesShared: u._count.resources,
      isFollowing: u.followers.length > 0,
    })),
  };
}

/** How much of the viewer's batch is here, against the hand-entered batch size. */
export async function getBatchDensity(viewer: CurrentUser): Promise<Density | null> {
  if (!viewer.college || !viewer.branchCode || !viewer.graduatingBatch) return null;
  const [verified, size] = await Promise.all([
    prisma.user.count({
      where: { verificationStatus: 'VERIFIED', collegeId: viewer.collegeId, branchCode: viewer.branchCode, graduatingBatch: viewer.graduatingBatch },
    }),
    prisma.cohortSize.findUnique({
      where: {
        collegeCode_branchCode_graduatingBatch: { collegeCode: viewer.college.code, branchCode: viewer.branchCode, graduatingBatch: viewer.graduatingBatch },
      },
      select: { size: true },
    }),
  ]);
  return density(verified, size?.size);
}
