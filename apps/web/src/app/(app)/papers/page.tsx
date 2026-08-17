import { Suspense } from 'react';

import { ResourceBrowser } from '@/features/resources/resource-browser';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Papers' };

/** Browse previous-year question papers, filterable by subject. */
export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Question Papers</h1>
        <p className="text-sm text-muted-foreground">
          Previous-year papers contributed by RGPV students.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ResourceBrowser type="PAPER" emptyLabel="papers" selectedSubject={subject} />
      </Suspense>
    </div>
  );
}
