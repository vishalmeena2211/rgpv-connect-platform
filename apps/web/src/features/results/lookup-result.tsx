import Link from 'next/link';
import { GraduationCap, Printer, RefreshCw } from 'lucide-react';
import { latestDeclaredSemester, parseEnrollment } from '@rgpv/shared';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CurrentUser } from '@/lib/session';
import { formatWhen, maskEnrollment } from '@/lib/utils';

import { saveLookup } from './actions';
import { getCredits, getSemesterSubjects } from './queries';
import { ResultCard } from './result-card';
import { InvalidEnrollment, NotDeclared, PortalDown, RateLimited } from './result-states';
import { lookupResult } from './service';
import { ShareDialog } from './share-dialog';
import { lookupHref } from './links';

/**
 * Runs one lookup (cache first) and renders the outcome. Wrapped in Suspense
 * by its pages so the shell paints immediately while RGPV's portal answers.
 */
export async function LookupResult({
  mode,
  enrollment,
  semester,
  fresh,
  viewer,
}: {
  mode: 'public' | 'app';
  enrollment: string;
  semester: number;
  fresh: boolean;
  viewer: CurrentUser | null;
}) {
  const parsed = parseEnrollment(enrollment);
  if (!parsed) return <InvalidEnrollment value={enrollment} />;

  const outcome = await lookupResult(parsed.raw, semester, {
    fresh,
    limitKey: viewer ? `lookup:user:${viewer.id}` : undefined,
  });
  const href = (s: number, extra = '') => `${lookupHref(mode, parsed.raw, s)}${extra}`;
  const latest = latestDeclaredSemester(parsed.admissionYear);

  if (outcome.kind === 'not_declared') {
    const fallback = latest && latest !== semester ? latest : semester > 1 ? semester - 1 : null;
    return (
      <NotDeclared
        enrollment={parsed.raw}
        semester={semester}
        latestSemester={fallback}
        latestHref={fallback ? href(fallback) : null}
        notifyHref={viewer ? '/settings#notifications' : `/login?callbackUrl=${encodeURIComponent('/settings#notifications')}`}
      />
    );
  }
  if (outcome.kind === 'unavailable') {
    return (
      <PortalDown
        cause={outcome.cause}
        enrollment={parsed.raw}
        retryHref={href(semester, '&fresh=1')}
        lastKnown={outcome.lastKnown}
        lastKnownHref={outcome.lastKnown ? href(outcome.lastKnown.semester) : null}
      />
    );
  }
  if (outcome.kind === 'rate_limited') return <RateLimited retryAfterSeconds={outcome.retryAfterSeconds} />;

  const { result } = outcome;
  const [credits, subjects] = await Promise.all([
    getCredits(parsed.branchCode, semester),
    getSemesterSubjects(parsed.branchCode, semester),
  ]);
  const names = new Map(subjects.flatMap((s) => (s.code ? [[s.code, s.name] as const] : [])));
  const isOwn = viewer?.enrollmentNumber === parsed.raw;

  async function save() {
    'use server';
    await saveLookup(parsed!.raw, semester);
  }

  return (
    <ResultCard
      result={result}
      credits={credits}
      names={names}
      actions={
        <>
          <ShareDialog
            kind="public"
            enrollment={parsed.raw}
            semester={semester}
            preview={{
              semester,
              session: result.session ?? null,
              sgpa: result.sgpa ?? null,
              cgpa: result.cgpa ?? null,
              previousCgpa: null,
              name: null,
              line: maskEnrollment(parsed.raw),
              rank: null,
              verified: false,
            }}
          />
          {/* RGPV's own Print Marksheet, in a new tab that opens the print dialog. */}
          <Button asChild variant="outline" size="sm">
            <a href={`/result/${parsed.raw}/print?semester=${semester}`} target="_blank" rel="noopener">
              <Printer />
              Print marksheet
            </a>
          </Button>
          {isOwn ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/results/me">
                <GraduationCap />
                Open My results
              </Link>
            </Button>
          ) : !viewer || viewer.verificationStatus !== 'VERIFIED' ? (
            <form action={save}>
              <Button type="submit" size="sm">
                <GraduationCap />
                Save to My results
              </Button>
            </form>
          ) : null}
        </>
      }
      footer={
        <>
          {outcome.fromCache ? `Fetched ${formatWhen(outcome.fetchedAt)}` : 'Fetched from result.rgpv.ac.in just now'} ·{' '}
          <Link href={href(semester, '&fresh=1')} className="inline-flex items-center gap-1 font-semibold text-accent-foreground">
            <RefreshCw className="size-3" />
            Fetch again
          </Link>
        </>
      }
    />
  );
}

/** What the page shows while the portal answers. */
export function LookupResultSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-raised" aria-busy="true">
      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
        Asking RGPV’s portal. This usually takes about 10 seconds.
      </div>
      <Skeleton className="h-7 w-64" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-[92px]" />
        <Skeleton className="h-[92px]" />
        <Skeleton className="h-[92px]" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}
