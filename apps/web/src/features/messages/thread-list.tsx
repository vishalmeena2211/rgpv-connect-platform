'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, initials, relativeTime } from '@/lib/utils';

import type { ConversationSummary } from './queries';

/** The inbox column. On phones it is the whole screen until a thread opens. */
export function ThreadList({ conversations }: { conversations: ConversationSummary[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col">
      {conversations.map((c) => {
        const active = pathname === `/messages/${c.id}`;
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              aria-current={active ? 'page' : undefined}
              className={cn('grid grid-cols-[auto_1fr_auto] items-center gap-2.5 border-b px-3.5 py-3 hover:bg-subtle', active && 'bg-accent hover:bg-accent')}
            >
              <Avatar>
                {c.other.avatarUrl ? <AvatarImage src={c.other.avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials(c.other.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className={cn('block truncate text-[13px]', c.isUnread ? 'font-bold' : 'font-semibold')}>{c.other.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.lastMessage ?? 'No messages yet'}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                {c.lastMessageAt ? <span className="text-[11px] text-faint">{relativeTime(c.lastMessageAt)}</span> : null}
                {c.isUnread ? <span className="size-2 rounded-full bg-primary" aria-label="Unread" /> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
