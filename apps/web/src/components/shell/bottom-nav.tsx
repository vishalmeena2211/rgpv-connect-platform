'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MOBILE_TABS } from '@/config/nav';
import { cn } from '@/lib/utils';

/** Phone tab bar: Results, Notes, Messages, Me. Hidden at `md` and up. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t bg-card/90 px-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur-md md:hidden">
      {MOBILE_TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`) || (href === '/me' && (pathname.startsWith('/u/') || pathname === '/settings'));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium',
              active ? 'bg-accent text-accent-foreground' : 'text-faint',
            )}
          >
            <Icon className="size-[22px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
