import { type NotificationType } from '@rgpv/shared';
import { prisma } from '@rgpv/db';

/** A notification flattened with its actor for rendering. */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; name: string; avatarUrl: string | null };
}

/** Load a user's notifications, newest first. */
export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      type: true,
      entityId: true,
      readAt: true,
      createdAt: true,
      actor: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    entityId: notification.entityId,
    isRead: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
    actor: notification.actor,
  }));
}

/** Count a user's unread notifications, for the top-bar badge. */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, readAt: null },
  });
}
