'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Lookup', href: '/results' },
  { label: 'My Results', href: '/results/me' },
  { label: 'Calculator', href: '/results/calculator' },
] as const;

/** Pill sub-navigation shared across the result-section screens. */
export function ResultsNav() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex rounded-lg bg-muted p-1 text-sm">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
