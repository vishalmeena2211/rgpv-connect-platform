import * as React from 'react';

import { cn } from '@/lib/utils';

/** Native checkbox in the brand colour, with its label beside it. */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: React.ReactNode; hint?: React.ReactNode }
>(({ className, label, hint, id, ...props }, ref) => (
  <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2.5 text-[13px] leading-5', className)}>
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-[5px] accent-[rgb(var(--primary))]"
      {...props}
    />
    <span>
      {label}
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </span>
  </label>
));
Checkbox.displayName = 'Checkbox';

/** On/off switch built on a checkbox, for settings rows. */
export const Switch = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    role="switch"
    className={cn(
      'relative h-6 w-10 shrink-0 cursor-pointer appearance-none rounded-full bg-input transition-colors',
      'before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-white before:shadow-card before:transition-transform',
      'checked:bg-primary checked:before:translate-x-4 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Switch.displayName = 'Switch';
