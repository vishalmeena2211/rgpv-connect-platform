import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/** Flat uppercase status pills. Status only, never decoration. */
const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase leading-[14px] tracking-[0.06em] [&_svg]:size-[11px]',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        success: 'bg-success-soft text-success-foreground',
        warning: 'bg-warning-soft text-warning-foreground',
        destructive: 'bg-destructive-soft text-destructive-foreground',
        info: 'bg-info-soft text-info-foreground',
        accent: 'bg-accent text-accent-foreground',
        verified: 'bg-primary text-primary-foreground',
        outline: 'border border-border text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
