import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';

import { Callout } from '@/components/ui/callout';
import { VerifyFlow } from '@/features/auth/verify-flow';
import { getCollegeNames } from '@/lib/public-stats';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Verify your enrollment' };

/** Signed-in but unverified users verify here; verified users go straight to My results. */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollment?: string; semester?: string; claimed?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.verificationStatus === 'VERIFIED') redirect('/results/me');

  const { enrollment, semester, claimed } = await searchParams;
  if (claimed) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-11 place-items-center rounded-[13px] bg-warning-soft">
          <Clock className="size-5 text-warning-foreground" />
        </span>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">We are checking {claimed}</h1>
        <Callout tone="info" title="Your claim is with the reviewers">
          They check RGPV’s record and decide within two days. Come back to this page: once the number is released to
          you, you can verify straight away. Until then, you can still check results and browse notes.
        </Callout>
      </div>
    );
  }

  const semesterNumber = Number(semester);
  return (
    <VerifyFlow
      initialEnrollment={enrollment?.toUpperCase() ?? ''}
      initialSemester={Number.isInteger(semesterNumber) && semesterNumber >= 1 && semesterNumber <= 8 ? semesterNumber : undefined}
      collegeNames={await getCollegeNames()}
    />
  );
}
