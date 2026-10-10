import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Absence is not an error: an icon, what is true, and what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-1 px-5 py-9 text-center', className)}>
      <span className="mb-2 grid size-11 place-items-center rounded-[14px] bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <p className="font-display text-[15px] font-bold">{title}</p>
      {children ? <div className="max-w-md text-[13px] text-muted-foreground">{children}</div> : null}
      {action ? <div className="mt-3 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
