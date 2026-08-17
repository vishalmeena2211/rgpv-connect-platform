import { redirect } from 'next/navigation';

import { getCurrentUser, isVerified } from '@/lib/session';
import { ListingForm } from '@/features/marketplace/listing-form';

export const metadata = { title: 'Sell an Item' };

/** Verified-user screen for creating a marketplace listing. */
export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!isVerified(user)) redirect('/market');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Sell an Item</h1>
        <p className="text-sm text-muted-foreground">
          Your listing is visible to students at your college.
        </p>
      </header>
      <ListingForm />
    </div>
  );
}
