import Link from 'next/link';
import { ImageIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn, formatPrice } from '@/lib/utils';

import type { ListingItem } from './listing-queries';

const CATEGORY = { BOOKS: 'Books', ELECTRONICS: 'Electronics', NOTES: 'Notes', HOSTEL: 'Hostel', OTHER: 'Other' } as const;

export function ListingCard({ listing }: { listing: ListingItem }) {
  return (
    <Link href={`/market/${listing.id}`} className={cn('flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-colors hover:border-input', listing.isSold && 'opacity-60')}>
      <div className="grid h-[132px] place-items-center bg-gradient-to-br from-muted to-subtle">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-faint" />
        )}
      </div>
      <div className="flex flex-col gap-1 px-3.5 py-3">
        <p className="line-clamp-2 text-[13px] font-semibold">{listing.title}</p>
        <p className="flex items-center gap-2 font-display text-[15px] font-bold tabular">
          {formatPrice(listing.priceCents)}
          {listing.isSold ? <Badge>Sold</Badge> : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[CATEGORY[listing.category], listing.seller.name, listing.pickup].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  );
}
