import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Share2, ShieldCheck, TrendingUp } from 'lucide-react';

import { JsonLd } from '@/components/json-ld';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LookupForm } from '@/features/results/lookup-form';
import { Sparkline } from '@/features/results/trend-chart';
import { getCollegeNames, getPublicStats } from '@/lib/public-stats';
import { openGraph, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { formatCount } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: openGraph('RGPV Connect: RGPV results, CGPA, notes and papers', SITE_DESCRIPTION, '/'),
};

/** Public landing: the promise on the left, a working lookup on the right. */
export default async function LandingPage() {
  const [stats, collegeNames] = await Promise.all([getPublicStats(), getCollegeNames()]);
  const showCounts = stats.flagshipVerified >= 50;

  return (
    <div className="relative overflow-hidden">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            description: SITE_DESCRIPTION,
            inLanguage: 'en-IN',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/icons/512`,
            sameAs: ['https://github.com/vishalmeena2211/rgpv-connect-platform'],
          },
        ]}
      />
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-14">
        <div>
          <span className="inline-flex h-[30px] items-center gap-2 rounded-full border bg-card py-0 pl-1.5 pr-3 text-xs font-medium shadow-card">
            <span className="grid size-[18px] place-items-center rounded-full bg-success-soft">
              <Check className="size-[11px] text-success-foreground" />
            </span>
            {showCounts
              ? `${formatCount(stats.checkedToday)} results checked today · ${formatCount(stats.flagshipVerified)} verified at ${stats.flagshipName}`
              : 'Free and open source · for every RGPV student'}
          </span>
          <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[44px] tracking-[-0.035em] sm:text-[52px] sm:leading-[56px]">
            Your RGPV result, in ten seconds. <span className="text-primary">Then your whole batch.</span>
          </h1>
          <p className="mt-4 max-w-[46ch] text-[17px] leading-[27px] text-muted-foreground">
            Check any semester result without signing up. Verify your enrollment once and keep every semester, your CGPA
            trend, and a network where every student is real.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button asChild size="lg">
              <Link href="/login">Join with your enrollment</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/how-it-works">See how verification works</Link>
            </Button>
          </div>
          <dl className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2 text-xs text-muted-foreground">
            {showCounts ? (
              <div>
                <dt className="sr-only">Verified students</dt>
                <dd>
                  <b className="font-display text-sm text-foreground tabular">{formatCount(stats.flagshipVerified)}</b> verified at{' '}
                  {stats.flagshipName}
                </dd>
              </div>
            ) : null}
            <div>
              <dd>
                <b className="font-display text-sm text-foreground">Free</b>, no ads, open source
              </dd>
            </div>
            <div>
              <dd>
                <b className="font-display text-sm text-foreground">Nothing stored</b> unless you save it
              </dd>
            </div>
          </dl>
        </div>

        <div id="check" className="scroll-mt-24 rounded-xl border bg-card p-5 shadow-float sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-[15px] font-bold">Check a result</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card py-1 pl-1 pr-2.5 text-[11px] font-medium shadow-card">
              <span className="grid size-4 place-items-center rounded-full bg-success-soft">
                <Check className="size-2.5 text-success-foreground" />
              </span>
              Live from result.rgpv.ac.in
            </span>
          </div>
          <LookupForm mode="public" collegeNames={collegeNames} />
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl gap-3 px-4 pb-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <article className="flex min-h-[150px] flex-col gap-2 rounded-lg border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="grid size-[34px] place-items-center rounded-[10px] bg-accent">
              <TrendingUp className="size-[17px] text-accent-foreground" />
            </span>
            <Badge>Example</Badge>
          </div>
          <h3 className="font-display text-sm font-bold">Every semester, one trend</h3>
          <p className="text-[12.5px] leading-[18px] text-muted-foreground">
            SGPA 7.42 → 7.85 → 8.10 → 8.41. CGPA 7.95, and what you need next semester for the CGPA you want.
          </p>
          <Sparkline values={[7.42, 7.85, 8.1, 8.41]} className="mt-auto h-11 w-full" />
        </article>
        <article className="bg-ink-gradient relative flex min-h-[150px] flex-col gap-2 overflow-hidden rounded-lg border border-ink p-5 text-ink-foreground shadow-card">
          <div className="glow-primary pointer-events-none absolute inset-0" aria-hidden />
          <span className="relative grid size-[34px] place-items-center rounded-[10px] bg-white/10">
            <ShieldCheck className="size-[17px]" />
          </span>
          <h3 className="relative font-display text-sm font-bold">Verified by enrollment</h3>
          <p className="relative text-[12.5px] leading-[18px] text-ink-foreground/75">
            We fetch a real result to prove the number is yours. College, branch and batch come from the number, never from
            a form.
          </p>
        </article>
        <article className="flex min-h-[150px] flex-col gap-2 rounded-lg border bg-card p-5 shadow-card">
          <span className="grid size-[34px] place-items-center rounded-[10px] bg-accent">
            <Share2 className="size-[17px] text-accent-foreground" />
          </span>
          <h3 className="font-display text-sm font-bold">A card for your batch group</h3>
          <p className="text-[12.5px] leading-[18px] text-muted-foreground">
            Your SGPA on a verified card with your name, one tap to WhatsApp. Nobody can fake it.
          </p>
        </article>
      </section>
    </div>
  );
}
