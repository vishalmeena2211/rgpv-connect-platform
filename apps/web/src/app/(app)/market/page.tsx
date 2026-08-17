import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentUser, isVerified } from '@/lib/session';
import { CategoryFilter } from '@/features/marketplace/category-filter';
import { ListingCard } from '@/features/marketplace/listing-card';
import { getListings } from '@/features/marketplace/listing-queries';

export const metadata = { title: 'Market' };

const CATEGORIES = ['BOOKS', 'ELECTRONICS', 'NOTES', 'HOSTEL', 'OTHER'] as const;
type Category = (typeof CATEGORIES)[number];

const isCategory = (value: string | undefined): value is Category =>
  value !== undefined && (CATEGORIES as readonly string[]).includes(value);

/** Campus marketplace: students buy and sell within their college. */
export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const listings = await getListings(
    user?.collegeId ?? null,
    isCategory(category) ? category : undefined,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-sm text-muted-foreground">
              Buy and sell books, gadgets, and hostel essentials on campus.
            </p>
          </div>
          <CategoryFilter />
        </div>
        {isVerified(user) ? (
          <Button asChild size="sm">
            <Link href="/market/new">
              <Plus />
              Sell
            </Link>
          </Button>
        ) : null}
      </header>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nothing listed yet. Be the first to sell something.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
