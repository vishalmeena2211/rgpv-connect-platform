'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';

import { AFTER_LAUNCH_ITEMS, NAV_ITEMS, type NavItem } from '@/config/nav';
import type { Feature } from '@/lib/features';
import { cn } from '@/lib/utils';

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active, count }: { item: NavItem; active: boolean; count?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2 text-[13px] font-medium transition-colors',
        active
          ? 'border-border bg-card text-foreground shadow-card'
          : 'border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground',
      )}
    >
      <Icon className={cn('size-[18px] shrink-0', active && 'text-primary')} />
      {item.label}
      {count ? (
        <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground tabular">{count}</span>
      ) : null}
    </Link>
  );
}

/** Desktop left rail. Hidden below the `md` breakpoint (the tab bar takes over). */
export function Sidebar({
  openFeatures,
  isAdmin,
  unreadMessages,
}: {
  openFeatures: Feature[];
  isAdmin: boolean;
  unreadMessages: number;
}) {
  const pathname = usePathname();
  const open = new Set(openFeatures);
  const openLater = AFTER_LAUNCH_ITEMS.filter((item) => item.feature && open.has(item.feature));
  const closedLater = AFTER_LAUNCH_ITEMS.filter((item) => item.feature && !open.has(item.feature));

  return (
    <aside className="sticky top-[60px] hidden h-[calc(100dvh-60px)] w-[232px] shrink-0 flex-col gap-0.5 overflow-y-auto px-3 py-4 md:flex">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href) || (item.href === '/me' && pathname.startsWith('/u/'))}
          count={item.href === '/messages' ? unreadMessages : undefined}
        />
      ))}
      {openLater.length > 0 ? (
        <>
          <p className="px-2.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">Campus</p>
          {openLater.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </>
      ) : null}
      {closedLater.length > 0 ? (
        <>
          <p className="px-2.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">After launch</p>
          {closedLater.map(({ label, href, icon: Icon }) => (
            <span key={href} className="flex cursor-default items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-faint" title="Opens when your college passes a third verified">
              <Icon className="size-[18px] shrink-0" />
              {label}
              <span className="ml-auto rounded-[5px] border px-1.5 text-[9px] font-bold uppercase leading-[15px] tracking-[0.06em]">Later</span>
            </span>
          ))}
        </>
      ) : null}
      {isAdmin ? (
        <div className="mt-auto pt-4">
          <NavLink item={{ label: 'Admin', href: '/admin', icon: Shield }} active={isActive(pathname, '/admin')} />
        </div>
      ) : null}
    </aside>
  );
}
