import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Read-only star rating with the numeric value and count. */
export function Stars({ rating, count, className }: { rating: number; count: number; className?: string }) {
  if (count === 0) return <span className={cn('text-xs text-muted-foreground', className)}>Not rated yet</span>;
  const full = Math.round(rating);
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span className="inline-flex text-warning" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn('size-3', i < full ? 'fill-current' : 'opacity-30')} />
        ))}
      </span>
      <span className="tabular">
        {rating.toFixed(1)} ({count})
      </span>
    </span>
  );
}
