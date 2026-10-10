import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { LookupForm } from '@/features/results/lookup-form';
import { getShareCard } from '@/features/results/share';
import { ShareCardView } from '@/features/results/share-card-view';
import { getCollegeNames } from '@/lib/public-stats';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const card = await getShareCard(token);
  if (!card) return { title: 'Card not found' };
  const who = card.data.name ?? 'An RGPV student';
  const title = `${who} · SGPA ${card.data.sgpa?.toFixed(2) ?? '—'} in semester ${card.data.semester}`;
  return {
    title,
    description: 'Check your own RGPV result in ten seconds on RGPV Connect.',
    openGraph: { title, images: [{ url: `/api/share/${token}/image`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, images: [`/api/share/${token}/image`] },
    robots: { index: false },
  };
}

/** The page a shared card opens: the card, then the lookup that started it. */
export default async function SharedCardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [card, collegeNames] = await Promise.all([getShareCard(token), getCollegeNames()]);
  if (!card) notFound();

  return (
    <div className="relative overflow-hidden">
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col items-center gap-4">
          <ShareCardView data={card.data} />
          <p className="text-center text-xs text-muted-foreground">
            {card.data.verified ? 'Verified: this student proved the enrollment number is theirs.' : 'Fetched from RGPV’s result portal.'}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-[32px] font-extrabold leading-9 tracking-[-0.03em]">Check yours in ten seconds</h1>
          <p className="text-[15px] text-muted-foreground">No sign-up. Type your enrollment number and we ask RGPV’s portal for you.</p>
          <div className="rounded-xl border bg-card p-5 shadow-float">
            <LookupForm mode="public" compact collegeNames={collegeNames} />
          </div>
          <Button asChild variant="ghost" className="self-start">
            <Link href="/how-it-works">How verification works</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
