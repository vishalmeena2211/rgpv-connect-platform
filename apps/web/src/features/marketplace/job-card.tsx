import { Briefcase, ExternalLink, MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { relativeTime } from '@/lib/utils';

import { type JobListItem } from './job-queries';

const TYPE_LABEL = {
  FULL_TIME: 'Full-time',
  INTERNSHIP: 'Internship',
  PART_TIME: 'Part-time',
} as const;

/** A job-board card: title, employer, meta chips, and an apply link. */
export function JobCard({ job }: { job: JobListItem }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{job.company}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {TYPE_LABEL[job.type]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {job.isRemote ? 'Remote' : (job.location ?? 'On-site')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="size-3.5" />
            {job.postedBy}
          </span>
          <span>{relativeTime(job.createdAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
          {job.description}
        </p>
        <Button asChild size="sm" variant="outline">
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
            Apply
            <ExternalLink />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
