import Link from 'next/link';
import { Bell, MessageCircle, Search } from 'lucide-react';

import { Wordmark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { UserMenu } from '@/components/shell/user-menu';
import { getUnreadMessageCount } from '@/features/messages/queries';
import { getUnreadNotificationCount } from '@/features/notifications/queries';
import { getCurrentUser } from '@/lib/session';

/** Count bubble on a quick-action icon; hidden when zero. */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground tabular">
      {count > 9 ? '9+' : count}
    </span>
  );
}

/** Sticky, blurred top bar for the signed-in app. Signed-out visitors get sign-in buttons. */
export async function TopBar() {
  const user = await getCurrentUser();
  const [unreadMessages, unreadNotifications] = user
    ? await Promise.all([getUnreadMessageCount(user.id), getUnreadNotificationCount(user.id)])
    : [0, 0];

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b bg-card/80 backdrop-blur-md">
      <div className="flex h-[60px] items-center gap-3 px-4 md:px-5">
        <Wordmark href={user ? '/results' : '/'} />

        <form action="/search" className="relative ml-auto hidden w-full max-w-sm md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            name="q"
            placeholder="Search notes, papers, students…"
            aria-label="Search"
            className="h-[38px] w-full rounded-[10px] border bg-card pl-9 pr-3 text-[13px] shadow-card placeholder:text-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" aria-label={`Messages${unreadMessages ? `, ${unreadMessages} unread` : ''}`} asChild className="relative">
                <Link href="/messages">
                  <MessageCircle className="!size-[19px]" />
                  <CountBadge count={unreadMessages} />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`} asChild className="relative">
                <Link href="/notifications">
                  <Bell className="!size-[19px]" />
                  <CountBadge count={unreadNotifications} />
                </Link>
              </Button>
              <ThemeToggle />
              <UserMenu name={user.name} avatarUrl={user.avatarUrl} userId={user.id} isAdmin={user.role === 'ADMIN'} />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/login">Join with your enrollment</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
