'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';

import { getCurrentUser, isVerified } from '@/lib/session';

/** Result of a join toggle: the resulting membership state, or an error. */
export type JoinResult = { ok: true; member: boolean } | { ok: false; error: string };

/** Join or leave a group, toggling on the viewer's current membership. */
export async function toggleGroupMembership(groupId: string): Promise<JoinResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (!isVerified(user)) return { ok: false, error: 'Verify your enrollment to join groups.' };

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  if (existing) {
    await prisma.groupMember.delete({ where: { id: existing.id } });
  } else {
    await prisma.groupMember.create({ data: { groupId, userId: user.id } });
  }

  revalidatePath('/groups');
  return { ok: true, member: !existing };
}
