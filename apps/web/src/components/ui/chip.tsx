import Link from 'next/link';

import { cn } from '@/lib/utils';

const chipClass = (on: boolean) =>
  cn(
    'inline-flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors [&_svg]:size-3.5',
    on
      ? 'border-accent-strong bg-accent text-accent-foreground'
      : 'border-border bg-card text-muted-foreground hover:border-input hover:text-foreground',
  );

/** A filter pill that is a link (URL-driven filters). */
export function ChipLink({
  href,
  on = false,
  children,
  className,
}: {
  href: string;
  on?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} aria-current={on ? 'true' : undefined} className={cn(chipClass(on), className)} scroll={false}>
      {children}
    </Link>
  );
}

/** A filter pill that is a button (client-side state). */
export function ChipButton({
  on = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return <button type="button" aria-pressed={on} className={cn(chipClass(on), className)} {...props} />;
}

/** A row of chips that scrolls sideways on narrow screens. */
export function ChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5', className)}>{children}</div>;
}
