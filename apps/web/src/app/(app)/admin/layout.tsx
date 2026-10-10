import { requireAdmin } from '@/lib/session';

import { AdminTabs } from './tabs';

/** Admin area: hidden from everyone else (a plain 404). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
      <AdminTabs />
      {children}
    </div>
  );
}
