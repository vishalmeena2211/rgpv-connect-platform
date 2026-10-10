import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SegmentedItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * Route-driven segmented control: a muted track with the active item raised.
 * Used for sibling pages that read as one area (Look up / My results / Calculator).
 */
export function Segmented({
  items,
  active,
  className,
}: {
  items: SegmentedItem[];
  active: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        'scrollbar-none inline-flex max-w-full gap-0.5 self-start overflow-x-auto rounded-[11px] bg-muted p-[3px]',
        className,
      )}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const on = href === active;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] px-3.5 text-[13px] font-medium transition-colors',
              on ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon ? <Icon className={cn('size-3.5', on && 'text-primary')} /> : null}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
