import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, ShoppingBag } from 'lucide-react';

import { FeatureClosed } from '@/components/feature-closed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { ListingCard } from '@/features/marketplace/listing-card';
import { getListings } from '@/features/marketplace/listing-queries';
import { isFeatureOpen } from '@/lib/features';
import { isVerified, requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Market' };

const CATEGORIES = [['', 'All'], ['BOOKS', 'Books'], ['ELECTRONICS', 'Electronics'], ['HOSTEL', 'Hostel'], ['NOTES', 'Notes'], ['OTHER', 'Other']] as const;

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const user = await requireUser('/market');
  if (!isFeatureOpen('campus', user.role)) return <FeatureClosed feature="campus" />;
  const { category } = await searchParams;
  const active = CATEGORIES.find(([v]) => v && v === category)?.[0];
  const listings = await getListings(user.collegeId, (active || undefined) as 'BOOKS' | undefined);
  const college = user.college?.shortName ?? 'your college';

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-4">
      <PageHeader
        title="Market"
        description={`Buy and sell inside ${college}. Everyone here is a verified student.`}
        actions={isVerified(user) ? <Button asChild><Link href="/market/new"><Plus />Sell something</Link></Button> : null}
      />
      <ChipRow>
        {CATEGORIES.map(([value, label]) => (
          <ChipLink key={label} href={value ? `/market?category=${value}` : '/market'} on={(active ?? '') === value}>{label}</ChipLink>
        ))}
      </ChipRow>
      {listings.length === 0 ? (
        <Card><EmptyState icon={ShoppingBag} title="Nothing listed yet">Books from last semester sell fastest in the first week of term.</EmptyState></Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
      )}
    </div>
  );
}
