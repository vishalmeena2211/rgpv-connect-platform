import { type Prisma, prisma } from '@rgpv/db';
import type { NotificationType } from '@rgpv/shared';

/** A notification flattened with its actor for rendering. */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  entityId: string | null;
  data: Prisma.JsonValue | null;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; name: string; avatarUrl: string | null; branchCode: string | null; graduatingBatch: number | null } | null;
}

/** A user's notifications, newest first. */
export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      type: true,
      entityId: true,
      data: true,
      readAt: true,
      createdAt: true,
      actor: { select: { id: true, name: true, avatarUrl: true, branchCode: true, graduatingBatch: true } },
    },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    entityId: notification.entityId,
    data: notification.data,
    isRead: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
    actor: notification.actor,
  }));
}

/** Count a user's unread notifications, for the top-bar badge. */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { recipientId: userId, readAt: null } });
}
