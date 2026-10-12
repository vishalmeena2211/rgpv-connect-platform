import type { Metadata } from 'next';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Check your email', robots: { index: false, follow: true } };

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="grid size-11 place-items-center rounded-[13px] bg-accent">
        <MailCheck className="size-5 text-accent-foreground" />
      </span>
      <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">Check your email</h1>
      <p className="text-[13px] leading-5 text-muted-foreground">
        We sent you a sign-in link. Open it on this device; it works once and expires in 15 minutes. It can take a minute to
        arrive, so check spam too.
      </p>
      {process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Development: no email service is set up, so the link is printed in the dev server’s terminal.
        </p>
      ) : null}
      <Button asChild variant="ghost">
        <Link href="/login">Use a different email</Link>
      </Button>
    </div>
  );
}
