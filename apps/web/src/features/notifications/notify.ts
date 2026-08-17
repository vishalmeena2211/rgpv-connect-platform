import { type NotificationType } from '@rgpv/shared';
import { prisma } from '@rgpv/db';

/**
 * Record an activity notification. Internal server-side helper called from
 * other server actions (follow, like, message) — not a Server Action itself.
 *
 * No-ops when the actor is the recipient (you don't notify yourself) so callers
 * can fire it unconditionally.
 */
export async function notify(params: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  entityId?: string;
}): Promise<void> {
  if (params.recipientId === params.actorId) return;

  await prisma.notification.create({
    data: {
      recipientId: params.recipientId,
      actorId: params.actorId,
      type: params.type,
      entityId: params.entityId ?? null,
    },
  });
}
