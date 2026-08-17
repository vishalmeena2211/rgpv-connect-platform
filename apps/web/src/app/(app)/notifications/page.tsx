import Link from 'next/link';
import { type NotificationType } from '@rgpv/shared';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/auth';
import { cn, initials, relativeTime } from '@/lib/utils';
import { MarkReadButton } from '@/features/notifications/mark-read-button';
import {
  getNotifications,
  type NotificationItem,
} from '@/features/notifications/queries';

export const metadata = { title: 'Notifications' };

const VERB: Record<NotificationType, string> = {
  FOLLOW: 'started following you',
  POST_LIKE: 'liked your post',
  POST_COMMENT: 'commented on your post',
  MESSAGE: 'sent you a message',
};

/** Where clicking a notification takes you, by type. */
function hrefFor(notification: NotificationItem): string {
  switch (notification.type) {
    case 'FOLLOW':
      return `/u/${notification.actor.id}`;
    case 'MESSAGE':
      return notification.entityId ? `/messages/${notification.entityId}` : '/messages';
    default:
      return '/feed';
  }
}

/** Activity feed: follows, likes, comments, and message alerts. */
export default async function NotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const notifications = userId ? await getNotifications(userId) : [];
  const hasUnread = notifications.some((notification) => !notification.isRead);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <MarkReadButton hasUnread={hasUnread} />
      </header>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No notifications yet. Follows, likes, and messages will show up here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Link key={notification.id} href={hrefFor(notification)} className="block">
              <Card
                className={cn(
                  'transition-colors hover:bg-accent/50',
                  !notification.isRead && 'border-primary/40 bg-primary/5',
                )}
              >
                <CardContent className="flex items-center gap-3 py-3">
                  <Avatar className="size-9">
                    {notification.actor.avatarUrl ? (
                      <AvatarImage src={notification.actor.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(notification.actor.name)}</AvatarFallback>
                  </Avatar>
                  <p className="flex-1 text-sm">
                    <span className="font-medium">{notification.actor.name}</span>{' '}
                    <span className="text-muted-foreground">{VERB[notification.type]}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(notification.createdAt)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
