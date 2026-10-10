import 'server-only';

import webpush from 'web-push';

import { prisma } from '@rgpv/db';

import { env } from '@/lib/env';

/** What a push notification shows and where tapping it goes. */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

let configured: boolean | null = null;

/** True when VAPID keys are set; without them push is off and in-app notifications still work. */
export function pushConfigured(): boolean {
  if (configured === null) {
    configured = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
    if (configured) webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
  }
  return configured;
}

/**
 * Send a push to every device a user subscribed. Dead subscriptions (the
 * browser uninstalled or revoked) are removed. Never throws.
 */
export async function sendPush(userId: string, payload: PushPayload): Promise<number> {
  if (!pushConfigured()) return 0;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 },
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
        } else {
          console.warn('Push failed', { status });
        }
      }
    }),
  );
  return sent;
}
