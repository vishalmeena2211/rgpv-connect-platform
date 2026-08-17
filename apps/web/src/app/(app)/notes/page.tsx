import { Suspense } from 'react';

import { ResourceBrowser } from '@/features/resources/resource-browser';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Notes' };

/** Browse student-contributed lecture notes, filterable by subject. */
export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Notes</h1>
        <p className="text-sm text-muted-foreground">
          Lecture notes shared by RGPV students, organised by subject.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ResourceBrowser type="NOTE" emptyLabel="notes" selectedSubject={subject} />
      </Suspense>
    </div>
  );
}
