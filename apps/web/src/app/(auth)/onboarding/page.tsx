import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { EnrollmentVerification } from '@/features/auth/enrollment-verification';

export const metadata = { title: 'Get verified' };

/**
 * Onboarding gate. Signed-in but unverified users land here to verify their
 * enrollment; already-verified users skip straight to the feed.
 */
export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.verificationStatus === 'VERIFIED') redirect('/feed');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">One step to go</h1>
        <p className="text-muted-foreground">Verify your enrollment to join your college network.</p>
      </div>
      <EnrollmentVerification />
    </div>
  );
}
