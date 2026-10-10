import Link from 'next/link';

import { cn } from '@/lib/utils';

/** The mark: a teal tile with a white square, and the name beside it. */
export function Wordmark({ href = '/', suffix, className }: { href?: string; suffix?: string; className?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5 font-display text-base font-bold tracking-[-0.02em]', className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-primary" aria-hidden>
        <span className="block size-2.5 rounded-[3px] bg-white" />
      </span>
      RGPV Connect
      {suffix ? <span className="font-semibold text-muted-foreground">· {suffix}</span> : null}
    </Link>
  );
}
