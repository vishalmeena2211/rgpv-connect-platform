import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/session';
import { JobCard } from '@/features/marketplace/job-card';
import { JobTypeFilter } from '@/features/marketplace/job-type-filter';
import { getJobs } from '@/features/marketplace/job-queries';

export const metadata = { title: 'Jobs' };

const JOB_TYPES = ['FULL_TIME', 'INTERNSHIP', 'PART_TIME'] as const;
type JobType = (typeof JOB_TYPES)[number];

const isJobType = (value: string | undefined): value is JobType =>
  value !== undefined && (JOB_TYPES as readonly string[]).includes(value);

/** Jobs & internships board. Recruiters post; students browse and apply. */
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ type }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const jobs = await getJobs(isJobType(type) ? type : undefined);
  const canPost = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Jobs &amp; Internships</h1>
            <p className="text-sm text-muted-foreground">
              Opportunities for RGPV students and alumni.
            </p>
          </div>
          <JobTypeFilter />
        </div>
        {canPost ? (
          <Button asChild size="sm">
            <Link href="/jobs/new">
              <Plus />
              Post a job
            </Link>
          </Button>
        ) : null}
      </header>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No openings posted yet. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
