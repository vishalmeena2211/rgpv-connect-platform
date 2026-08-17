'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PRIMARY_NAV_ITEMS } from '@/config/nav';
import { cn } from '@/lib/utils';

/** Mobile bottom tab bar. Hidden at `md` and up (sidebar takes over). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 backdrop-blur md:hidden">
      {PRIMARY_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 py-2 text-xs',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
