import Link from 'next/link';
import { ArrowRight, GraduationCap, Newspaper, ShieldCheck, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  {
    icon: GraduationCap,
    title: 'Results & analytics',
    body: 'Instant result lookup, SGPA/CGPA trends, and "what-if" projections for next semester.',
  },
  {
    icon: Newspaper,
    title: 'Notes & papers',
    body: 'Crowd-sourced, rated notes and previous-year papers — organised by branch and semester.',
  },
  {
    icon: Users,
    title: 'Verified network',
    body: 'Connect with batchmates, seniors and juniors — auto-grouped by college and branch.',
  },
  {
    icon: ShieldCheck,
    title: 'Real identities',
    body: 'Every member is verified by their RGPV enrollment, so the network stays trustworthy.',
  },
];

/** Public landing page (marketing route group). */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between px-6">
        <span className="text-lg font-bold tracking-tight">
          RGPV<span className="text-primary">Connect</span>
        </span>
        <Button asChild variant="ghost">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
          <ShieldCheck className="size-4" /> For RGPV University students, Bhopal
        </p>
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
          The verified network for <span className="text-primary">RGPV students.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Results, notes, papers and your entire campus network — in one place. Join with your
          enrollment number and connect with your college, branch and batch.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">
              Join with your enrollment <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/results">Check a result</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="flex gap-4 p-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
