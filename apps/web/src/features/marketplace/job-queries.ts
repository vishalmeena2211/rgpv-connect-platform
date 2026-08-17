import { type JobType } from '@rgpv/shared';
import { prisma } from '@rgpv/db';

/** A job-board entry flattened with its poster for display. */
export interface JobListItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: JobType;
  isRemote: boolean;
  description: string;
  applyUrl: string;
  createdAt: string;
  postedBy: string;
}

/** List the most recent job posts, optionally filtered by employment type. */
export async function getJobs(type?: JobType): Promise<JobListItem[]> {
  const jobs = await prisma.jobPost.findMany({
    where: type ? { type } : {},
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      type: true,
      isRemote: true,
      description: true,
      applyUrl: true,
      createdAt: true,
      postedBy: { select: { name: true } },
    },
  });

  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    isRemote: job.isRemote,
    description: job.description,
    applyUrl: job.applyUrl,
    createdAt: job.createdAt.toISOString(),
    postedBy: job.postedBy.name,
  }));
}
