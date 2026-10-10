import { ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ShareCardData } from './share';

/** The card itself: big SGPA on the dark ink gradient, name and cohort, domain. */
export function ShareCardView({ data, className }: { data: ShareCardData; className?: string }) {
  const change = data.cgpa != null && data.previousCgpa != null ? data.cgpa - data.previousCgpa : null;
  return (
    <div
      className={cn(
        'bg-ink-gradient relative flex h-fit w-full max-w-[360px] flex-col gap-3 self-start overflow-hidden rounded-[22px] p-[22px] text-ink-foreground shadow-float',
        className,
      )}
    >
      <div className="glow-primary pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-ink-foreground/80">
        <span className="font-display font-bold">RGPV Connect</span>
        <span>
          Semester {data.semester}
          {data.session ? ` · ${data.session}` : ''}
        </span>
      </div>
      <div className="relative">
        <p className="font-display text-[54px] font-extrabold leading-[56px] tracking-[-0.04em] tabular">
          {data.sgpa?.toFixed(2) ?? '—'}
          <span className="ml-2 font-sans text-sm font-semibold tracking-[0.04em] text-ink-foreground/80">SGPA</span>
        </p>
        {data.cgpa != null ? (
          <p className="text-xs text-ink-foreground/80 tabular">
            CGPA {data.cgpa.toFixed(2)}
            {change != null ? ` · ${change >= 0 ? 'up' : 'down'} from ${data.previousCgpa!.toFixed(2)}` : ''}
          </p>
        ) : null}
      </div>
      <div className="relative">
        {data.name ? <p className="font-display text-[17px] font-bold">{data.name}</p> : null}
        <p className="text-xs text-ink-foreground/80 tabular">{data.line}</p>
        {data.rank ? <p className="mt-1 text-xs font-semibold text-ink-foreground">{data.rank}</p> : null}
      </div>
      <div className="relative flex justify-between border-t border-ink-foreground/20 pt-2.5 text-[11px] text-ink-foreground/80">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="size-3" />
          {data.verified ? 'Verified result' : 'From RGPV’s portal'}
        </span>
        <span>rgpvconnect.co.in</span>
      </div>
    </div>
  );
}
