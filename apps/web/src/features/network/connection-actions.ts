'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';

import { getCurrentUser } from '@/lib/session';
import { notify } from '@/features/notifications/notify';

/** Result of a follow toggle: the resulting state, or an error. */
export type FollowResult = { ok: true; following: boolean } | { ok: false; error: string };

/**
 * Follow or unfollow another user. Toggling is derived from the current edge
 * state so the same action serves both buttons. Self-follows are rejected.
 */
export async function toggleFollow(targetUserId: string): Promise<FollowResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (user.id === targetUserId) return { ok: false, error: "You can't follow yourself." };

  const existing = await prisma.connection.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
  });

  if (existing) {
    await prisma.connection.delete({ where: { id: existing.id } });
  } else {
    await prisma.connection.create({
      data: { followerId: user.id, followingId: targetUserId },
    });
    await notify({ recipientId: targetUserId, actorId: user.id, type: 'FOLLOW' });
  }

  revalidatePath('/network');
  revalidatePath(`/u/${targetUserId}`);
  return { ok: true, following: !existing };
}
