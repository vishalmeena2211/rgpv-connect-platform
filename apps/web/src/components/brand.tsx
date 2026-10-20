import Link from 'next/link';

import { BrandMarkSvg } from '@/components/brand-mark';
import { cn } from '@/lib/utils';

/** The mark (eight semesters, the last in marigold under a graduation cap) and the name beside it. */
export function Wordmark({ href = '/', suffix, className }: { href?: string; suffix?: string; className?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5 font-display text-base font-bold tracking-[-0.02em]', className)}>
      <BrandMarkSvg size={28} />
      <span>
        RGPV <span className="text-primary">Connect</span>
      </span>
      {suffix ? <span className="font-semibold text-muted-foreground">· {suffix}</span> : null}
    </Link>
  );
}
