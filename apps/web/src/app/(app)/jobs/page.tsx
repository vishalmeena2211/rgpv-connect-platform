import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Plus } from 'lucide-react';

import { FeatureClosed } from '@/components/feature-closed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { JobCard } from '@/features/marketplace/job-card';
import { getJobs } from '@/features/marketplace/job-queries';
import { isFeatureOpen } from '@/lib/features';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Jobs and internships' };

const TYPES = [['', 'All'], ['INTERNSHIP', 'Internships'], ['FULL_TIME', 'Full time'], ['PART_TIME', 'Part time']] as const;

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ type?: string; mine?: string; remote?: string }> }) {
  const user = await requireUser('/jobs');
  if (!isFeatureOpen('campus', user.role)) return <FeatureClosed feature="campus" />;
  const query = await searchParams;
  const type = TYPES.some(([v]) => v && v === query.type) ? (query.type as 'INTERNSHIP') : undefined;
  const mine = query.mine !== '0' && Boolean(user.branchCode);
  const remote = query.remote === '1';
  const jobs = await getJobs({ type, branch: mine ? (user.branchCode ?? undefined) : undefined, batch: mine ? (user.graduatingBatch ?? undefined) : undefined, remote });
  const canPost = user.role === 'RECRUITER' || user.role === 'ADMIN';
  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams({ ...(type ? { type } : {}), ...(mine ? {} : { mine: '0' }), ...(remote ? { remote: '1' } : {}) });
    Object.entries(patch).forEach(([k, v]) => (v === undefined ? next.delete(k) : next.set(k, v)));
    return `/jobs${next.size ? `?${next}` : ''}`;
  };

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-4">
      <PageHeader
        title="Jobs and internships"
        description="Posted by verified recruiters and placement cells. Free to post, free to apply."
        actions={
          canPost ? (
            <Button asChild><Link href="/jobs/new"><Plus />Post a job</Link></Button>
          ) : (
            <Button disabled title="Only verified recruiters and placement cells can post"><Plus />Post a job</Button>
          )
        }
      />
      <ChipRow>
        {TYPES.map(([value, label]) => (
          <ChipLink key={label} href={href({ type: value || undefined })} on={(type ?? '') === value}>{label}</ChipLink>
        ))}
        <span className="mx-1 self-center text-faint">|</span>
        {user.branchCode ? (
          <ChipLink href={href({ mine: mine ? '0' : undefined })} on={mine}>For {user.branchCode} {user.graduatingBatch}</ChipLink>
        ) : null}
        <ChipLink href={href({ remote: remote ? undefined : '1' })} on={remote}>Remote</ChipLink>
      </ChipRow>
      {jobs.length === 0 ? (
        <Card><EmptyState icon={Briefcase} title="No open jobs match">Try removing a filter. New postings show up here first.</EmptyState></Card>
      ) : (
        <div className="flex flex-col gap-2.5">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div>
      )}
    </div>
  );
}
