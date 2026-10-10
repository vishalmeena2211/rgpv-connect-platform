import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ImageIcon, MessageCircle } from 'lucide-react';

import { FeatureClosed } from '@/components/feature-closed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { startConversation } from '@/features/messages/actions';
import { MarkSoldButton } from '@/features/marketplace/mark-sold';
import { getListing } from '@/features/marketplace/listing-queries';
import { ReportDialog } from '@/features/network/report-dialog';
import { isFeatureOpen } from '@/lib/features';
import { isVerified, requireUser } from '@/lib/session';
import { batchTag, formatPrice, initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Listing' };

/** One listing, one action: message the seller. The trust line says who they are. */
export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/market/${id}`);
  if (!isFeatureOpen('campus', user.role)) return <FeatureClosed feature="campus" />;
  const listing = await getListing(id);
  if (!listing) notFound();
  const seller = listing.seller;
  const isOwn = seller.id === user.id;
  const since = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(seller.createdAt);

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4">
      <Link href="/market" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-3.5" />
        Market
      </Link>
      <Card className="grid overflow-hidden md:grid-cols-[320px_1fr]">
        <div className="grid min-h-[240px] place-items-center bg-gradient-to-br from-muted to-subtle">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.imageUrl} alt={listing.title} className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-8 text-faint" />
          )}
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div>
            <h1 className="font-display text-xl font-bold tracking-[-0.02em]">{listing.title}</h1>
            <p className="mt-1 flex items-center gap-2 font-display text-2xl font-bold tabular">
              {formatPrice(listing.priceCents)}
              {listing.status === 'SOLD' ? <Badge>Sold</Badge> : null}
            </p>
          </div>
          <p className="whitespace-pre-wrap text-[13.5px] leading-[21px]">{listing.description}</p>
          {listing.pickup ? <p className="text-[13px] text-muted-foreground">Pick up from {listing.pickup}.</p> : null}
          <Link href={`/u/${seller.id}`} className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-subtle">
            <Avatar>
              {seller.avatarUrl ? <AvatarImage src={seller.avatarUrl} alt="" /> : null}
              <AvatarFallback>{initials(seller.name)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                {seller.name}
                {seller.verificationStatus === 'VERIFIED' ? <Badge variant="verified">Verified</Badge> : null}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {[batchTag(seller.branchCode, seller.graduatingBatch), seller.college?.shortName, `on RGPV Connect since ${since}`, `${seller._count.listings} sold`].filter(Boolean).join(' · ')}
              </span>
            </span>
          </Link>
          {isOwn ? (
            listing.status === 'ACTIVE' ? <MarkSoldButton id={listing.id} /> : <p className="text-[13px] text-muted-foreground">Marked sold. It stays greyed in the market for a week.</p>
          ) : listing.status === 'ACTIVE' && isVerified(user) ? (
            <form action={startConversation.bind(null, seller.id)}>
              <Button type="submit" size="lg" className="w-full">
                <MessageCircle />
                Message {seller.name.split(' ')[0]}
              </Button>
            </form>
          ) : null}
          {!isOwn ? <div><ReportDialog target={{ kind: 'listing', id: listing.id, ownerName: seller.name }} /></div> : null}
          <p className="text-xs text-muted-foreground">Pay in person. RGPV Connect never takes payment or a cut, so never pay online before you have the item.</p>
        </div>
      </Card>
    </div>
  );
}
