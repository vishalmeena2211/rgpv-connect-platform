import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const calloutVariants = cva('rounded-md border px-3.5 py-3 text-[13px] leading-[19px]', {
  variants: {
    tone: {
      info: 'border-info/25 bg-info-soft',
      success: 'border-success/30 bg-success-soft',
      warning: 'border-warning/30 bg-warning-soft',
      danger: 'border-destructive/25 bg-destructive-soft',
      brand: 'border-accent-strong bg-accent',
    },
  },
  defaultVariants: { tone: 'info' },
});

/** Title says what is true; body says the consequence or the next step. */
export function Callout({
  tone,
  title,
  action,
  className,
  children,
}: VariantProps<typeof calloutVariants> & {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}
      className={cn(calloutVariants({ tone }), action && 'flex flex-wrap items-center gap-3', className)}
    >
      <div className={cn(action && 'min-w-0 flex-1')}>
        {title ? <p className="mb-0.5 font-display font-bold">{title}</p> : null}
        {children ? <div className="text-foreground/90">{children}</div> : null}
      </div>
      {action}
    </div>
  );
}
