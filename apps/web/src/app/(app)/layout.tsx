import { BottomNav } from '@/components/shell/bottom-nav';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';

/**
 * Shell for all authenticated pages: sticky top bar, a desktop sidebar and a
 * mobile bottom tab bar. The route group `(app)` keeps these pages visually
 * distinct from the marketing/auth pages without affecting the URL.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar />
        <main className="min-h-[calc(100vh-4rem)] flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
