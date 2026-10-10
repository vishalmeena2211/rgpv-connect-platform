import { BottomNav } from '@/components/shell/bottom-nav';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';
import { getUnreadMessageCount } from '@/features/messages/queries';
import { enabledFeatures } from '@/lib/features';
import { getCurrentUser } from '@/lib/session';

/**
 * Shell for the app: blurred top bar, the left rail on desktop, the tab bar on
 * phones. Pages render on the warm ground in white cards.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const open = isAdmin ? (['network', 'campus'] as const) : [...enabledFeatures()];
  const unread = user ? await getUnreadMessageCount(user.id) : 0;

  return (
    <div className="min-h-dvh">
      <TopBar />
      <div className="mx-auto flex w-full max-w-[1320px]">
        <Sidebar openFeatures={[...open]} isAdmin={isAdmin} unreadMessages={unread} />
        <main className="min-h-[calc(100dvh-60px)] min-w-0 flex-1 px-4 pb-28 pt-6 md:px-7 md:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
