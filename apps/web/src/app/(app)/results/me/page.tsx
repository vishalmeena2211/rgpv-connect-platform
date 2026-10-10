import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Zap } from 'lucide-react';
import { prisma } from '@rgpv/db';
import { branchName, COURSE_SEMESTERS, completedSemesters } from '@rgpv/shared';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatTile } from '@/components/ui/stat-tile';
import { BoardToggle } from '@/features/results/board-toggle';
import { getBoard, getCohortProgress, getCredits, getSavedResults, getStanding, syncPlan } from '@/features/results/queries';
import { ResultsTabs } from '@/features/results/results-tabs';
import { SemesterList } from '@/features/results/semester-list';
import { ShareDialog } from '@/features/results/share-dialog';
import { SyncPanel } from '@/features/results/sync-panel';
import { TrendChart } from '@/features/results/trend-chart';
import { isVerified, requireUser } from '@/lib/session';
import { cn, formatWhen } from '@/lib/utils';

export const metadata: Metadata = { title: 'My results' };

export default async function MyResultsPage() {
  const user = await requireUser('/results/me');

  if (!isVerified(user) || !user.enrollmentNumber) {
    return (
      <div className="mx-auto flex max-w-[900px] flex-col gap-5">
        <PageHeader title="My results" />
        <ResultsTabs active="/results/me" />
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="Verify your enrollment to unlock this"
            action={
              <Button asChild>
                <Link href="/onboarding">Verify enrollment</Link>
              </Button>
            }
          >
            Once you confirm your RGPV enrollment number, we fetch every semester for you and chart your CGPA over time.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const saved = await getSavedResults(user.id);
  const plan = syncPlan(user.admissionYear, saved);
  const subtitle = [user.enrollmentNumber, user.branchCode ? branchName(user.branchCode) : null, user.graduatingBatch ? `batch ${user.graduatingBatch}` : null]
    .filter(Boolean)
    .join(' · ');

  if (saved.length === 0) {
    return (
      <div className="mx-auto flex max-w-[900px] flex-col gap-5">
        <PageHeader title="My results" description={subtitle} />
        <ResultsTabs active="/results/me" />
        <Card>
          <EmptyState icon={GraduationCap} title="No results saved yet">
            Fetch every declared semester from RGPV’s portal. It takes 5 to 15 seconds a semester.
          </EmptyState>
          <CardContent className="mx-auto w-full max-w-sm pt-0">
            <SyncPanel pending={plan.pending} label={`Fetch ${plan.pending.length} semester${plan.pending.length === 1 ? '' : 's'}`} variant="default" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const latest = saved.at(-1)!;
  const previous = saved.at(-2);
  const [standing, board, progress, declared] = await Promise.all([
    getStanding(user, latest),
    getBoard(user, latest.semester),
    getCohortProgress(user, latest.semester),
    prisma.notification.findFirst({
      where: { recipientId: user.id, type: 'RESULT_DECLARED', entityId: String(latest.semester), createdAt: { gte: new Date(Date.now() - 3 * 86_400_000) } },
      select: { createdAt: true },
    }),
  ]);
  const credits = new Map(await Promise.all(saved.map(async (r) => [r.semester, await getCredits(user.branchCode, r.semester)] as const)));
  const totalCredits = [...credits.values()].reduce((sum, map) => sum + [...map.values()].reduce((a, b) => a + b, 0), 0);
  const cgpaChange = latest.cgpa != null && previous?.cgpa != null ? latest.cgpa - previous.cgpa : null;
  const best = Math.max(...saved.map((r) => r.sgpa ?? 0));
  const completed = user.admissionYear ? completedSemesters(user.admissionYear) : null;
  const rankLabel = standing?.topPercent ? `Top ${standing.topPercent}% in ${user.branchCode} ${user.graduatingBatch}` : null;
  const cohortLabel = [user.branchCode && user.graduatingBatch ? `${user.branchCode} ${user.graduatingBatch}` : null, user.college?.shortName]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      {declared ? (
        <Callout
          tone="brand"
          title={`Semester ${latest.semester} results are out`}
          action={
            <ShareDialog
              kind="own"
              semester={latest.semester}
              rankLabel={rankLabel}
              preview={{ semester: latest.semester, session: latest.payload?.session ?? null, sgpa: latest.sgpa, cgpa: latest.cgpa, previousCgpa: previous?.cgpa ?? null, name: user.name, line: cohortLabel, rank: null, verified: true }}
              trigger={<Button size="sm">Share your card</Button>}
            />
          }
        >
          Your result was fetched {formatWhen(latest.fetchedAt).toLowerCase()}.
        </Callout>
      ) : null}

      <PageHeader
        title="My results"
        description={subtitle}
        actions={
          <ShareDialog
            kind="own"
            semester={latest.semester}
            rankLabel={rankLabel}
            preview={{ semester: latest.semester, session: latest.payload?.session ?? null, sgpa: latest.sgpa, cgpa: latest.cgpa, previousCgpa: previous?.cgpa ?? null, name: user.name, line: cohortLabel, rank: null, verified: true }}
          />
        }
      />
      <ResultsTabs active="/results/me" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          accent
          label="CGPA"
          value={latest.cgpa?.toFixed(2) ?? '—'}
          note={cgpaChange != null ? `${cgpaChange >= 0 ? '+' : ''}${cgpaChange.toFixed(2)} this semester` : `After ${latest.semester} semesters`}
        />
        <StatTile
          label="Latest SGPA"
          value={latest.sgpa?.toFixed(2) ?? '—'}
          note={latest.sgpa != null && latest.sgpa >= best ? `Semester ${latest.semester} · best so far` : `Semester ${latest.semester}${latest.payload?.session ? ` · ${latest.payload.session}` : ''}`}
          noteTone={latest.sgpa != null && latest.sgpa >= best ? 'up' : 'muted'}
        />
        <StatTile
          label="Semesters"
          value={saved.length}
          suffix={`of ${COURSE_SEMESTERS}`}
          note={`${saved.every((r) => r.status === 'PASS') ? 'All passed' : 'Some to clear'}${totalCredits ? ` · ${totalCredits} credits` : ''}`}
        />
        <StatTile
          label={user.branchCode && user.graduatingBatch ? `In ${user.branchCode} ${user.graduatingBatch}` : 'In your batch'}
          value={standing?.topPercent ? `Top ${standing.topPercent}%` : '—'}
          note={
            standing?.topPercent
              ? `Of ${standing.withResults} verified batchmates`
              : standing
                ? `Shown once 20 of your batch have results (${standing.withResults} now)`
                : 'Needs your college and batch'
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester by semester</CardTitle>
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-primary" /> SGPA
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-dashed border-faint" /> CGPA
            </span>
          </span>
        </CardHeader>
        <CardContent>
          <TrendChart points={saved.map((r) => ({ semester: r.semester, sgpa: r.sgpa, cgpa: r.cgpa }))} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="font-display text-base font-bold">Every semester</h2>
        <div className="sm:w-64">
          <SyncPanel pending={plan.pending} />
        </div>
      </div>
      <SemesterList
        results={saved}
        admissionYear={user.admissionYear}
        nextSemester={completed != null && completed < COURSE_SEMESTERS ? completed + 1 : null}
        credits={credits}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {cohortLabel} · semester {latest.semester}
          </CardTitle>
          <span className="text-xs text-muted-foreground">Only people who turned on “show me on the board”</span>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {progress ? (
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Zap className="size-4 text-warning" />
              {progress.withResult} of {progress.cohort} verified batchmates have semester {latest.semester} saved.
            </p>
          ) : null}
          {board.rows.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-[13px]">
                <thead className="bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                  <tr>
                    <th className="w-12 px-3.5 py-2.5">#</th>
                    <th className="px-3.5 py-2.5">Student</th>
                    <th className="px-3.5 py-2.5 text-right">SGPA</th>
                    <th className="px-3.5 py-2.5 text-right">CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {[...board.rows, ...(board.viewerRow ? [board.viewerRow] : [])].map((row) => (
                    <tr key={row.userId} className={cn('border-t', row.isViewer && 'bg-accent')}>
                      <td className="px-3.5 py-2.5 tabular">{row.rank}</td>
                      <td className="px-3.5 py-2.5 font-semibold">
                        {row.isViewer ? `${row.name} (you)` : <Link href={`/u/${row.userId}`}>{row.name}</Link>}
                      </td>
                      <td className="px-3.5 py-2.5 text-right tabular">{row.sgpa.toFixed(2)}</td>
                      <td className="px-3.5 py-2.5 text-right tabular">{row.cgpa?.toFixed(2) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">Nobody in your batch is on the board yet. Turn it on to be the first.</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {board.total > board.rows.length ? `Showing ${board.rows.length} of ${board.total} on the board` : `${board.total} on the board`}
            </span>
            <BoardToggle initial={user.showOnBoard} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
