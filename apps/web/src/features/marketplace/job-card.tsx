import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

import type { JobListItem } from './job-queries';

const TYPE = { FULL_TIME: 'Full time', INTERNSHIP: 'Internship', PART_TIME: 'Part time' } as const;

export function JobCard({ job }: { job: JobListItem }) {
  const facts = [
    job.company,
    job.isRemote ? 'Remote' : job.location,
    TYPE[job.type],
    job.pay,
    job.branches.length ? job.branches.join(', ') : 'any branch',
    job.batches.length ? `${job.batches.join(', ')} batch` : null,
  ].filter(Boolean);
  const closesSoon = job.closesAt ? new Date(job.closesAt).getTime() - Date.now() < 3 * 86_400_000 : false;
  return (
    <article className="grid grid-cols-[44px_1fr] gap-3.5 rounded-lg border bg-card p-4 shadow-card sm:grid-cols-[44px_1fr_auto]">
      <span className="grid size-11 place-items-center rounded-xl bg-muted font-display text-sm font-bold text-muted-foreground">
        {job.company.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-sm font-bold">{job.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{facts.join(' · ')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {job.source === 'PLACEMENT_CELL' ? 'Posted by the placement cell' : 'Posted by a verified recruiter'}
          {job.closesAt ? (
            <span className={closesSoon ? 'font-semibold text-warning-foreground' : undefined}> · Closes {formatDate(job.closesAt)}</span>
          ) : null}
        </p>
        <p className="mt-2 line-clamp-2 text-[13px] text-foreground/85">{job.description}</p>
      </div>
      <Button asChild size="sm" className="col-span-2 sm:col-span-1">
        <a href={`/api/jobs/${job.id}/apply`} target="_blank" rel="noopener noreferrer">
          <ExternalLink />
          Apply
        </a>
      </Button>
    </article>
  );
}
