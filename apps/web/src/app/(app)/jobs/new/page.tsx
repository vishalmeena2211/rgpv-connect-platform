import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FeatureClosed } from '@/components/feature-closed';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { JobForm } from '@/features/marketplace/job-form';
import { isFeatureOpen } from '@/lib/features';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Post a job' };

export default async function NewJobPage() {
  const user = await requireUser('/jobs/new');
  if (!isFeatureOpen('campus', user.role)) return <FeatureClosed feature="campus" />;
  if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') notFound();
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      <PageHeader title="Post a job" description="Students see it under Jobs, filtered by branch and batch. No payment, no featured posts." />
      <Card><CardContent><JobForm /></CardContent></Card>
    </div>
  );
}
