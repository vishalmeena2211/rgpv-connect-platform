'use client';

import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { syncMyResults } from './my-results-actions';

/**
 * Triggers a worker sync of the signed-in user's results across all semesters,
 * surfacing the outcome as a toast. The parent server component re-renders via
 * `revalidatePath` once new records are cached.
 */
export function SyncResultsButton({ hasResults }: { hasResults: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const summary = await syncMyResults();
      if (!summary.ok) {
        toast.error(summary.error ?? 'Sync failed.');
        return;
      }
      toast.success(
        summary.fetched > 0
          ? `Synced ${summary.fetched} semester${summary.fetched === 1 ? '' : 's'}.`
          : 'No new results found yet.',
      );
    });
  }

  return (
    <Button variant={hasResults ? 'outline' : 'default'} onClick={handleSync} disabled={isPending}>
      <RefreshCw className={isPending ? 'animate-spin' : undefined} />
      {isPending ? 'Syncing…' : hasResults ? 'Refresh' : 'Sync my results'}
    </Button>
  );
}
