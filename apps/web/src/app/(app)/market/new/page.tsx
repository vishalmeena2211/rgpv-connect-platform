import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { FeatureClosed } from '@/components/feature-closed';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ListingForm } from '@/features/marketplace/listing-form';
import { isFeatureOpen } from '@/lib/features';
import { isVerified, requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Sell something' };

export default async function NewListingPage() {
  const user = await requireUser('/market/new');
  if (!isFeatureOpen('campus', user.role)) return <FeatureClosed feature="campus" />;
  if (!isVerified(user)) redirect('/onboarding');
  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-4">
      <PageHeader title="Sell something" description={`Shown to verified students at ${user.college?.shortName ?? 'your college'}.`} />
      <Card><CardContent><ListingForm /></CardContent></Card>
    </div>
  );
}
