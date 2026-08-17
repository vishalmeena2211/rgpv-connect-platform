import { type GroupType } from '@rgpv/shared';
import { prisma } from '@rgpv/db';

/** A group card view-model with membership count and viewer's join state. */
export interface GroupListItem {
  id: string;
  name: string;
  type: GroupType;
  collegeName: string | null;
  memberCount: number;
  isMember: boolean;
}

/**
 * List groups the viewer can see, with member counts and the viewer's join
 * state. Ordered by popularity so active communities surface first.
 */
export async function getGroups(viewerId: string | null): Promise<GroupListItem[]> {
  const groups = await prisma.group.findMany({
    orderBy: { members: { _count: 'desc' } },
    take: 60,
    select: {
      id: true,
      name: true,
      type: true,
      college: { select: { name: true } },
      _count: { select: { members: true } },
      members: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
    },
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type,
    collegeName: group.college?.name ?? null,
    memberCount: group._count.members,
    isMember: Array.isArray(group.members) && group.members.length > 0,
  }));
}
