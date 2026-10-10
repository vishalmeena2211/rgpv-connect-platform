'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

import { rateResource } from './actions';

/** One tap to rate; tapping again changes your rating. */
export function RateControl({ id, initial, disabledReason }: { id: string; initial: number | null; disabledReason?: string }) {
  const [stars, setStars] = useState(initial ?? 0);
  const [hover, setHover] = useState(0);
  const [pending, startTransition] = useTransition();
  if (disabledReason) return <p className="text-xs text-muted-foreground">{disabledReason}</p>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onClick={() =>
              startTransition(async () => {
                const result = await rateResource(id, n);
                if (result.ok) {
                  setStars(n);
                  toast.success('Thanks for rating.');
                } else toast.error(result.error);
              })
            }
            className="p-0.5"
          >
            <Star className={cn('size-5 text-warning', (hover || stars) >= n ? 'fill-current' : 'opacity-30')} />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{stars ? 'Your rating' : 'Rate it'}</span>
    </div>
  );
}
