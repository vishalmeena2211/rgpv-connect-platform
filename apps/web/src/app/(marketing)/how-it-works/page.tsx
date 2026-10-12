import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, CheckCircle2, Fingerprint, Search, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'How verification works',
  description:
    'How RGPV Connect checks that every student is real: your enrollment number, one real result from RGPV, and the name on it. Your college, branch and batch come from the number.',
  alternates: { canonical: '/how-it-works' },
};

const STEPS = [
  { icon: Search, title: 'You sign in and type your enrollment number', body: 'With an email link or Google. No password to remember.' },
  { icon: Fingerprint, title: 'We fetch one of your real results from RGPV', body: 'The name on that result is the name on your account. Nobody types their own name, so nobody can pretend to be someone else.' },
  { icon: Building2, title: 'Your college, branch and batch come from the number', body: '0151CS241042 means UIT-RGPV, Computer Science, admitted 2024, batch 2028. You never pick them from a list, so groups are real.' },
  { icon: CheckCircle2, title: 'You confirm it is you', body: 'One enrollment number belongs to one account. If someone took yours, you can claim it back and we check with RGPV’s record.' },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <span className="grid size-11 place-items-center rounded-[13px] bg-accent">
          <ShieldCheck className="size-5 text-accent-foreground" />
        </span>
        <h1 className="font-display text-[34px] font-extrabold leading-10 tracking-[-0.03em]">How verification works</h1>
        <p className="max-w-[60ch] text-[15px] leading-6 text-muted-foreground">
          Most RGPV colleges do not give students a college email, so we cannot check you that way. Instead we check the one
          thing every RGPV student has: a real result on RGPV’s portal.
        </p>
      </header>
      <ol className="flex flex-col gap-3">
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="flex gap-4 rounded-lg border bg-card p-5 shadow-card">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent text-accent-foreground">
              <Icon className="size-[18px]" />
            </span>
            <div>
              <p className="font-display text-[11px] font-bold tracking-[0.1em] text-accent-foreground">STEP {index + 1}</p>
              <h2 className="mt-0.5 font-display text-[15px] font-bold">{title}</h2>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="rounded-lg border bg-subtle p-5 text-[13px] leading-5 text-muted-foreground">
        <h2 className="mb-1 font-display text-sm font-bold text-foreground">What we keep</h2>
        Your name, email, enrollment number and the results you save. Your results are private: other students see your name,
        branch and batch, never your grades, unless you share a card or turn on the semester board. You can delete everything
        from Settings. Read the <Link href="/privacy" className="font-semibold text-accent-foreground">privacy policy</Link>.
      </section>
      <div className="flex flex-wrap gap-2.5">
        <Button asChild size="lg">
          <Link href="/login">Join with your enrollment</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/#check">Check a result first</Link>
        </Button>
      </div>
    </div>
  );
}
