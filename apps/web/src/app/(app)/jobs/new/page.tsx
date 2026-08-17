import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/session';
import { JobForm } from '@/features/marketplace/job-form';

export const metadata = { title: 'Post a Job' };

/** Recruiter-only screen for posting a new opening. */
export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'RECRUITER' && user?.role !== 'ADMIN') {
    redirect('/jobs');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Post a Job</h1>
        <p className="text-sm text-muted-foreground">
          Reach verified RGPV students and alumni.
        </p>
      </header>
      <JobForm />
    </div>
  );
}
