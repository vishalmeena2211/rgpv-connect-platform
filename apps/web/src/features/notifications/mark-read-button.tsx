'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { markAllNotificationsRead } from './actions';

/** "Mark all read" control; disabled while there's nothing unread. */
export function MarkReadButton({ hasUnread }: { hasUnread: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={!hasUnread || isPending}
      onClick={() => startTransition(() => markAllNotificationsRead())}
    >
      Mark all read
    </Button>
  );
}
