import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';

import { JsonLd } from '@/components/json-ld';
import { Button } from '@/components/ui/button';
import {
  ExampleResult,
  Faq,
  FAQ,
  FinalCta,
  HowItWorks,
  JoinFeatures,
  NotesBand,
  PromiseStrip,
  ResultsCalendar,
  TrustAndPrivacy,
} from '@/features/landing/sections';
import { LookupForm } from '@/features/results/lookup-form';
import { getCollegeNames, getPublicStats } from '@/lib/public-stats';
import { openGraph, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { formatCount } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: openGraph('RGPV Connect: RGPV results, CGPA, notes and papers', SITE_DESCRIPTION, '/'),
};

/** Public landing: the promise and a working lookup up top, then the long page from features/landing/sections. */
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
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
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
            Your RGPV result in about ten seconds. <span className="text-primary">Then every semester, in one place.</span>
          </h1>
          <p className="mt-4 max-w-[46ch] text-[17px] leading-[27px] text-muted-foreground">
            Type your enrollment number and we ask RGPV’s result portal for you, live. No sign-up to check. Join once and
            keep every semester, your CGPA trend, notes and papers for your branch, and a batch where every student is
            verified.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button asChild size="lg">
              <Link href="/#check">Check a result</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#how">See how it works</Link>
            </Button>
          </div>
          <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            {showCounts ? (
              <li>
                <b className="font-display text-sm text-foreground tabular">{formatCount(stats.flagshipVerified)}</b> verified at{' '}
                {stats.flagshipName}
              </li>
            ) : null}
            <li>No sign-up to check</li>
            <li>Every branch, every semester</li>
            <li>Not affiliated with RGPV</li>
          </ul>
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

      <PromiseStrip />
      <HowItWorks />
      <ExampleResult />
      <JoinFeatures />
      <ResultsCalendar />
      <NotesBand />
      <TrustAndPrivacy />
      <Faq />
      <FinalCta />
    </div>
  );
}
