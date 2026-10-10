import 'server-only';

import { type Prisma, prisma } from '@rgpv/db';
import type { NotificationType } from '@rgpv/shared';

import { type PushPayload, sendPush } from '@/lib/push';

/** Which preference switch governs pushes for each type. */
const PUSH_PREFERENCE: Record<NotificationType, 'notifyResults' | 'notifyMessages' | 'notifyReviews' | 'notifySocial'> = {
  RESULT_DECLARED: 'notifyResults',
  MESSAGE: 'notifyMessages',
  RESOURCE_REVIEWED: 'notifyReviews',
  FOLLOW: 'notifySocial',
  POST_LIKE: 'notifySocial',
  POST_COMMENT: 'notifySocial',
};

/**
 * Record an in-app notification and, when the recipient allows it for this
 * type, push it to their devices. Server-side helper, not a Server Action.
 *
 * No-ops when the actor is the recipient, so callers can fire it unconditionally.
 */
export async function notify(params: {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  entityId?: string;
  data?: Prisma.InputJsonValue;
  push?: PushPayload;
}): Promise<void> {
  if (params.actorId && params.recipientId === params.actorId) return;

  const [, recipient] = await Promise.all([
    prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        actorId: params.actorId ?? null,
        type: params.type,
        entityId: params.entityId ?? null,
        data: params.data,
      },
    }),
    params.push
      ? prisma.user.findUnique({
          where: { id: params.recipientId },
          select: { notifyResults: true, notifyMessages: true, notifyReviews: true, notifySocial: true },
        })
      : null,
  ]);

  if (params.push && recipient?.[PUSH_PREFERENCE[params.type]]) {
    await sendPush(params.recipientId, params.push);
  }
}
