import type { Metadata } from 'next';
import { Suspense } from 'react';
import { latestDeclaredSemester, normaliseEnrollment, parseEnrollment } from '@rgpv/shared';

import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { LookupForm, RecentLookups } from '@/features/results/lookup-form';
import { LookupResult, LookupResultSkeleton } from '@/features/results/lookup-result';
import { ResultsTabs } from '@/features/results/results-tabs';
import { getCollegeNames } from '@/lib/public-stats';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Look up a result' };

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollment?: string; semester?: string; fresh?: string }>;
}) {
  const [query, viewer, collegeNames] = await Promise.all([searchParams, requireUser('/results/lookup'), getCollegeNames()]);
  const enrollment = query.enrollment ? normaliseEnrollment(query.enrollment) : null;
  const parsed = enrollment ? parseEnrollment(enrollment) : null;
  const requested = Number(query.semester);
  const semester =
    Number.isInteger(requested) && requested >= 1 && requested <= 8
      ? requested
      : ((parsed ? latestDeclaredSemester(parsed.admissionYear) : null) ?? 1);

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <PageHeader title="Results" description="Look up any RGPV semester result by enrollment number." />
      <ResultsTabs active="/results/lookup" />
      <Card>
        <CardContent className="grid gap-5 md:grid-cols-[1fr_220px]">
          <LookupForm
            key={`${enrollment ?? ''}-${semester}`}
            mode="app"
            initialEnrollment={enrollment ?? viewer.enrollmentNumber ?? ''}
            initialSemester={enrollment ? semester : undefined}
            collegeNames={collegeNames}
          />
          <RecentLookups mode="app" />
        </CardContent>
      </Card>
      {enrollment ? (
        <Suspense key={`${enrollment}-${semester}-${query.fresh ?? ''}`} fallback={<LookupResultSkeleton />}>
          <LookupResult mode="app" enrollment={enrollment} semester={semester} fresh={query.fresh === '1'} viewer={viewer} />
        </Suspense>
      ) : null}
    </div>
  );
}
