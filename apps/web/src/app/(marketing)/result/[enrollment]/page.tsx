import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Search } from 'lucide-react';
import { latestDeclaredSemester, normaliseEnrollment, parseEnrollment } from '@rgpv/shared';

import { Button } from '@/components/ui/button';
import { LookupResult, LookupResultSkeleton } from '@/features/results/lookup-result';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Result', robots: { index: false } };

function SemesterLink({ semester }: { semester: number }) {
  return <span className="tabular">Semester {semester}</span>;
}

/**
 * Public result page. The shell paints straight away; the result streams in
 * when RGPV's portal answers (or immediately from the six-hour cache).
 */
export default async function PublicResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollment: string }>;
  searchParams: Promise<{ semester?: string; fresh?: string }>;
}) {
  const [{ enrollment: raw }, query, viewer] = await Promise.all([params, searchParams, getCurrentUser()]);
  const enrollment = normaliseEnrollment(decodeURIComponent(raw));
  const parsed = parseEnrollment(enrollment);
  const requested = Number(query.semester);
  const semester = Number.isInteger(requested) && requested >= 1 && requested <= 8
    ? requested
    : (parsed ? latestDeclaredSemester(parsed.admissionYear) : null) ?? 1;

  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Result</p>
          {/* On phones the semester gets its own line instead of wrapping as "· Semester 6". */}
          <h1 className="font-display text-[28px] font-bold leading-9 tracking-[-0.025em] tabular">
            <span className="whitespace-nowrap">{enrollment}</span>
            <span className="sr-only sm:hidden">, </span>
            <span className="hidden sm:inline" aria-hidden>
              {' · '}
            </span>
            <span className="block whitespace-nowrap sm:inline">
              <SemesterLink semester={semester} />
            </span>
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/#check">
            <Search />
            Check another
          </Link>
        </Button>
      </div>
      <Suspense key={`${enrollment}-${semester}-${query.fresh ?? ''}`} fallback={<LookupResultSkeleton />}>
        <LookupResult mode="public" enrollment={enrollment} semester={semester} fresh={query.fresh === '1'} viewer={viewer} />
      </Suspense>
      {!viewer ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/onboarding?enrollment=${enrollment}`)}`} className="group flex flex-col gap-2 rounded-lg border bg-card p-5 shadow-card hover:border-input">
            <span className="flex items-center justify-between font-display text-sm font-bold">
              Keep every semester <span className="text-xs font-semibold text-accent-foreground group-hover:underline">Join</span>
            </span>
            <span className="text-[12.5px] leading-[18px] text-muted-foreground">
              Join with this number and we fetch your other semesters too, chart the CGPA, and tell you what you need next
              semester. About a minute.
            </span>
          </Link>
          <Link href="/login?callbackUrl=%2Fsettings%23notifications" className="group flex flex-col gap-2 rounded-lg border bg-card p-5 shadow-card hover:border-input">
            <span className="flex items-center justify-between font-display text-sm font-bold">
              Hear first on results day <span className="text-xs font-semibold text-accent-foreground group-hover:underline">Turn on</span>
            </span>
            <span className="text-[12.5px] leading-[18px] text-muted-foreground">
              One notification when the next semester is declared, with your result already fetched. Nothing else, ever.
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
