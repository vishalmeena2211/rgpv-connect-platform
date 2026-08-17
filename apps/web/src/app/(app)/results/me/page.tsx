import Link from 'next/link';

import { prisma } from '@rgpv/db';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultCard } from '@/features/results/result-card';
import { getMyResults } from '@/features/results/my-results-actions';
import { ResultsNav } from '@/features/results/results-nav';
import { SyncResultsButton } from '@/features/results/sync-button';

export const metadata = { title: 'My Results' };

/** Highlights a single headline metric (latest CGPA, semesters tracked, …). */
function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

/**
 * "My Results" dashboard for verified users: a one-click sync of every
 * semester from the RGPV portal, headline CGPA/SGPA metrics, and the full set
 * of cached semester cards.
 */
export default async function MyResultsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { verificationStatus: true, enrollmentNumber: true },
      })
    : null;

  const isVerified = user?.verificationStatus === 'VERIFIED' && Boolean(user.enrollmentNumber);

  if (!isVerified) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">My Results</h1>
        <Card>
          <CardHeader>
            <CardTitle>Verify your enrollment to unlock this</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Once you confirm your RGPV enrollment number, we can pull every semester result
              automatically and track your CGPA over time.
            </p>
            <Button asChild>
              <Link href="/onboarding">Verify enrollment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const results = await getMyResults();
  const latestWithCgpa = [...results].reverse().find((r) => r.cgpa != null);
  const latestSgpa = results.at(-1)?.sgpa;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">My Results</h1>
            <p className="text-sm text-muted-foreground">{user?.enrollmentNumber}</p>
          </div>
          <SyncResultsButton hasResults={results.length > 0} />
        </div>
        <ResultsNav />
      </header>

      {results.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No results cached yet. Hit “Sync my results” to pull them from the RGPV portal.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryTile label="Latest CGPA" value={latestWithCgpa?.cgpa?.toFixed(2) ?? '—'} />
            <SummaryTile label="Latest SGPA" value={latestSgpa?.toFixed(2) ?? '—'} />
            <SummaryTile label="Semesters" value={String(results.length)} />
          </div>

          <div className="space-y-6">
            {results.map((record) => (
              <ResultCard key={record.semester} result={record.payload} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
