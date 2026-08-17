import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, relativeTime } from '@/lib/utils';

import { type ListingItem } from './listing-queries';

const CATEGORY_LABEL = {
  BOOKS: 'Books',
  ELECTRONICS: 'Electronics',
  NOTES: 'Notes',
  HOSTEL: 'Hostel',
  OTHER: 'Other',
} as const;

/** A marketplace listing card: optional image, price, category, and seller. */
export function ListingCard({ listing }: { listing: ListingItem }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      {listing.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- listing images are arbitrary user-supplied URLs, unsuitable for next/image optimisation
        <img
          src={listing.imageUrl}
          alt=""
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{listing.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {CATEGORY_LABEL[listing.category]}
          </Badge>
        </div>
        <p className="text-lg font-bold tabular-nums">{formatPrice(listing.priceCents)}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-2">
        <p className="line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
        <p className="text-xs text-muted-foreground">
          <Link href={`/u/${listing.seller.id}`} className="hover:underline">
            {listing.seller.name}
          </Link>{' '}
          · {relativeTime(listing.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
