'use client';

import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

/**
 * Inbox and conversation side by side from `md` up. On phones only one shows:
 * the list at /messages, the conversation at /messages/[id].
 */
export function MessagesPanes({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const inThread = pathname !== '/messages';
  return (
    <div className="grid h-[calc(100dvh-60px-48px-96px)] min-h-[480px] overflow-hidden rounded-lg border bg-card shadow-card md:h-[calc(100dvh-60px-64px)] md:grid-cols-[300px_minmax(0,1fr)]">
      <aside className={cn('overflow-y-auto border-r', inThread ? 'hidden md:block' : 'block')}>
        <div className="border-b px-3.5 py-3">
          <p className="font-display text-sm font-bold">Messages</p>
        </div>
        {list}
      </aside>
      <section className={cn('min-h-0', inThread ? 'block' : 'hidden md:block')}>{children}</section>
    </div>
  );
}
