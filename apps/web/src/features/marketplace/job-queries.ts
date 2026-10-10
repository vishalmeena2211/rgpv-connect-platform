import 'server-only';

import { type JobSource, type JobType, prisma } from '@rgpv/db';

export interface JobListItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: JobType;
  source: JobSource;
  isRemote: boolean;
  pay: string | null;
  branches: string[];
  batches: number[];
  closesAt: string | null;
  description: string;
  createdAt: string;
}

export interface JobFilters {
  type?: JobType;
  branch?: string;
  batch?: number;
  remote?: boolean;
}

/** Open jobs (no closing date, or closing in the future), soonest closing first. */
export async function getJobs(filters: JobFilters): Promise<JobListItem[]> {
  const jobs = await prisma.jobPost.findMany({
    where: {
      OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.remote ? { isRemote: true } : {}),
      ...(filters.branch ? { AND: [{ OR: [{ branches: { isEmpty: true } }, { branches: { has: filters.branch } }] }] } : {}),
      ...(filters.batch ? { AND: [{ OR: [{ batches: { isEmpty: true } }, { batches: { has: filters.batch } }] }] } : {}),
    },
    orderBy: [{ closesAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: 60,
  });
  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    source: job.source,
    isRemote: job.isRemote,
    pay: job.pay,
    branches: job.branches,
    batches: job.batches,
    closesAt: job.closesAt?.toISOString() ?? null,
    description: job.description,
    createdAt: job.createdAt.toISOString(),
  }));
}
