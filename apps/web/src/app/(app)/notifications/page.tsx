import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell, CheckCircle2, MessageCircle, Share2, UserPlus, XCircle, Zap } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { MarkReadButton } from '@/features/notifications/mark-read-button';
import { getNotifications, type NotificationItem } from '@/features/notifications/queries';
import { requireUser } from '@/lib/session';
import { batchTag, cn, formatWhen, initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Notifications' };

type Row = { icon?: React.ReactNode; title: string; detail: string; action: { label: string; href: string; primary?: boolean } | null };

function describe(n: NotificationItem): Row {
  const data = (n.data ?? {}) as Record<string, unknown>;
  const actorName = n.actor?.name ?? 'Someone';
  const cohort = n.actor ? batchTag(n.actor.branchCode, n.actor.graduatingBatch) : null;
  switch (n.type) {
    case 'RESULT_DECLARED':
      return {
        icon: <Zap className="size-4" />,
        title: `Semester ${data.semester ?? n.entityId} results are out`,
        detail: typeof data.sgpa === 'number' ? `Your result was fetched. SGPA ${data.sgpa.toFixed(2)}.` : 'Your result is waiting in My results.',
        action: { label: 'Share card', href: '/results/me', primary: true },
      };
    case 'MESSAGE':
      return { title: `${actorName} sent you a message`, detail: cohort ?? 'Messages', action: { label: 'Reply', href: n.entityId ? `/messages/${n.entityId}` : '/messages' } };
    case 'RESOURCE_REVIEWED':
      return data.approved
        ? { icon: <CheckCircle2 className="size-4 text-success-foreground" />, title: `Your notes were published: ${String(data.title ?? '')}`, detail: 'Approved by a reviewer', action: { label: 'Open', href: '/uploads' } }
        : { icon: <XCircle className="size-4 text-destructive" />, title: `Not published: ${String(data.title ?? '')}`, detail: String(data.note ?? 'See the reviewer’s note in My uploads.'), action: { label: 'Edit and resend', href: '/uploads' } };
    case 'FOLLOW':
      return { title: `${actorName} started following you`, detail: cohort ?? '', action: n.actor ? { label: 'View profile', href: `/u/${n.actor.id}` } : null };
    case 'POST_LIKE':
      return { title: `${actorName} liked your post`, detail: cohort ?? '', action: { label: 'Open', href: '/feed' } };
    case 'POST_COMMENT':
      return { title: `${actorName} commented on your post`, detail: cohort ?? '', action: { label: 'Open', href: '/feed' } };
  }
}

export default async function NotificationsPage() {
  const user = await requireUser('/notifications');
  const notifications = await getNotifications(user.id);

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <PageHeader
        title="Notifications"
        actions={
          <>
            <MarkReadButton hasUnread={notifications.some((n) => !n.isRead)} />
            <Button asChild variant="outline" size="sm">
              <Link href="/settings#notifications">Settings</Link>
            </Button>
          </>
        }
      />
      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="Nothing yet">
            Results-day alerts, messages and reviews of your uploads show up here.
          </EmptyState>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {notifications.map((n) => {
            const row = describe(n);
            return (
              <li
                key={n.id}
                className={cn(
                  'grid grid-cols-[auto_1fr] items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-card sm:grid-cols-[auto_1fr_auto]',
                  !n.isRead && 'border-accent-strong bg-[rgb(var(--primary)/0.04)]',
                )}
              >
                {row.icon ? (
                  <span className={cn('grid size-8 place-items-center rounded-full', n.type === 'RESULT_DECLARED' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    {row.icon}
                  </span>
                ) : (
                  <Avatar>
                    {n.actor?.avatarUrl ? <AvatarImage src={n.actor.avatarUrl} alt="" /> : null}
                    <AvatarFallback>{n.actor ? initials(n.actor.name) : n.type === 'MESSAGE' ? <MessageCircle className="size-4" /> : <UserPlus className="size-4" />}</AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.detail ? `${row.detail} · ` : ''}
                    {formatWhen(n.createdAt)}
                  </p>
                </div>
                {row.action ? (
                  <Button asChild size="sm" variant={row.action.primary ? 'default' : 'outline'} className="col-span-2 sm:col-span-1">
                    <Link href={row.action.href}>
                      {row.action.primary ? <Share2 /> : null}
                      {row.action.label}
                    </Link>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
