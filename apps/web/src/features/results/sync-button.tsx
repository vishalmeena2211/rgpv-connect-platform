'use client';

import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { syncMyResults } from './my-results-actions';

/**
 * Triggers a worker sync of the signed-in user's results, surfacing the outcome
 * as a toast. The parent server component re-renders via `revalidatePath` once
 * new records are cached.
 *
 * Only semesters that can still change are fetched, so a repeat sync usually
 * finishes instantly. Shift-clicking forces a full re-fetch (e.g. after a
 * revaluation changes an already-published result).
 */
export function SyncResultsButton({ hasResults }: { hasResults: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleSync(event: React.MouseEvent) {
    const force = event.shiftKey;
    startTransition(async () => {
      const summary = await syncMyResults({ force });
      if (!summary.ok) {
        toast.error(summary.error ?? 'Sync failed.');
        return;
      }
      if (summary.fetched > 0) {
        toast.success(`Synced ${summary.fetched} semester${summary.fetched === 1 ? '' : 's'}.`);
      } else if (summary.skipped > 0) {
        toast.success('Already up to date.');
      } else {
        toast.success('No new results found yet.');
      }
    });
  }

  return (
    <Button
      variant={hasResults ? 'outline' : 'default'}
      onClick={handleSync}
      disabled={isPending}
      title={hasResults ? 'Shift-click to force a full re-fetch' : undefined}
    >
      <RefreshCw className={isPending ? 'animate-spin' : undefined} />
      {isPending ? 'Syncing…' : hasResults ? 'Refresh' : 'Sync my results'}
    </Button>
  );
}
