'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@rgpv/db';

import { getCurrentUser } from '@/lib/session';

/** Mark all of the signed-in user's notifications as read. */
export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath('/notifications');
}
