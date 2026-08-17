import { prisma } from '@rgpv/db';

import { type CurrentUser } from '@/lib/session';

/** A directory entry: a verified student plus the viewer's follow state. */
export interface DirectoryUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  branchCode: string | null;
  graduatingBatch: number | null;
  collegeName: string | null;
  isFollowing: boolean;
}

/** Filters for narrowing the directory; all optional. */
export interface DirectoryFilters {
  /** "college" restricts to the viewer's own college; "all" spans the university. */
  scope?: 'college' | 'all';
  branchCode?: string;
  batch?: number;
  search?: string;
}

/**
 * List verified students for the directory, excluding the viewer. Defaults to
 * the viewer's own college; supports branch / batch / name filters. Returns a
 * follow flag per user so cards can render the right button without an extra
 * round-trip.
 */
export async function getDirectory(
  viewer: CurrentUser,
  filters: DirectoryFilters,
): Promise<DirectoryUser[]> {
  const scope = filters.scope ?? 'college';

  const users = await prisma.user.findMany({
    where: {
      verificationStatus: 'VERIFIED',
      id: { not: viewer.id },
      ...(scope === 'college' && viewer.collegeId ? { collegeId: viewer.collegeId } : {}),
      ...(filters.branchCode ? { branchCode: filters.branchCode } : {}),
      ...(filters.batch ? { graduatingBatch: filters.batch } : {}),
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' as const } }
        : {}),
    },
    orderBy: { name: 'asc' },
    take: 60,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      branchCode: true,
      graduatingBatch: true,
      college: { select: { name: true } },
      followers: { where: { followerId: viewer.id }, select: { id: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    branchCode: user.branchCode,
    graduatingBatch: user.graduatingBatch,
    collegeName: user.college?.name ?? null,
    isFollowing: user.followers.length > 0,
  }));
}
