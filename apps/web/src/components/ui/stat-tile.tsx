import { cn } from '@/lib/utils';

/** A headline figure: label, big number, a line saying where it comes from. */
export function StatTile({
  label,
  value,
  suffix,
  note,
  noteTone = 'muted',
  accent = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: React.ReactNode;
  note?: React.ReactNode;
  noteTone?: 'muted' | 'up';
  /** The one dark tile per row: the number people came for. */
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 overflow-hidden rounded-lg border px-4 py-3.5 shadow-card',
        accent ? 'bg-ink-gradient border-ink text-ink-foreground' : 'bg-card',
        className,
      )}
    >
      {accent ? <div className="glow-primary pointer-events-none absolute inset-0" aria-hidden /> : null}
      <span
        className={cn(
          'relative text-[11px] font-semibold uppercase tracking-[0.08em]',
          accent ? 'text-ink-foreground/60' : 'text-faint',
        )}
      >
        {label}
      </span>
      <span className="relative font-display text-[28px] font-bold leading-8 tracking-[-0.03em] tabular">
        {value}
        {suffix ? <span className="ml-1 text-[13px] font-medium tracking-normal opacity-60">{suffix}</span> : null}
      </span>
      {note ? (
        <span
          className={cn(
            'relative text-xs',
            accent ? 'text-ink-foreground/70' : noteTone === 'up' ? 'font-medium text-success-foreground' : 'text-muted-foreground',
          )}
        >
          {note}
        </span>
      ) : null}
    </div>
  );
}
