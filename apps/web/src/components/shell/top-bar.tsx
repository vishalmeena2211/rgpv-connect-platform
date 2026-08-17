import Link from 'next/link';
import { Bell, MessageCircle, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { getCurrentUser } from '@/lib/session';
import { getUnreadNotificationCount } from '@/features/notifications/queries';
import { getUnreadMessageCount } from '@/features/messages/queries';

/** Small count bubble overlaid on a quick-action icon; hidden when zero. */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-primary-foreground">
      {count > 9 ? '9+' : count}
    </span>
  );
}

/** Sticky top bar: brand, search and quick actions. Shared across the app shell. */
export async function TopBar() {
  const user = await getCurrentUser();
  const [unreadMessages, unreadNotifications] = user
    ? await Promise.all([getUnreadMessageCount(user.id), getUnreadNotificationCount(user.id)])
    : [0, 0];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4">
        <Link href="/feed" className="text-lg font-bold tracking-tight">
          RGPV<span className="text-primary">Connect</span>
        </Link>

        <div className="relative ml-auto hidden max-w-md flex-1 sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search students, notes, jobs…"
            className="h-10 w-full rounded-full border border-input bg-muted/50 pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <Button variant="ghost" size="icon" aria-label="Messages" asChild>
            <Link href="/messages" className="relative">
              <MessageCircle className="size-5" />
              <CountBadge count={unreadMessages} />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" asChild>
            <Link href="/notifications" className="relative">
              <Bell className="size-5" />
              <CountBadge count={unreadNotifications} />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
