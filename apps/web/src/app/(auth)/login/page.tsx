import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GraduationCap } from 'lucide-react';

import { SignInForm } from '@/features/auth/sign-in-form';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign in' };

const ERRORS: Record<string, string> = {
  Verification: 'That sign-in link has expired or was already used. Ask for a new one.',
  OAuthAccountNotLinked: 'This email already has an account. Sign in with an email link instead.',
  AccessDenied: 'Sign-in was cancelled.',
  Configuration: 'Sign-in is not set up correctly on this server.',
};

/** Same-site paths only, to stop open redirects through ?callbackUrl. */
function safePath(value: string | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/onboarding';
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl, error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.verificationStatus === 'VERIFIED' ? '/results/me' : '/onboarding');

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-[13px] bg-primary">
          <GraduationCap className="size-[22px] text-primary-foreground" />
        </span>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">Join RGPV Connect</h1>
        <p className="mt-1.5 text-[13px] leading-[19px] text-muted-foreground">
          Sign in, then verify your enrollment number. Your college, branch and batch are filled in from it.
        </p>
      </div>
      <div className="flex justify-center gap-1.5" aria-label="Step 1 of 3">
        <span className="h-1 w-7 rounded-full bg-primary" />
        <span className="h-1 w-7 rounded-full bg-border" />
        <span className="h-1 w-7 rounded-full bg-border" />
      </div>
      <SignInForm
        callbackUrl={safePath(callbackUrl)}
        googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)}
        error={error ? (ERRORS[error] ?? 'Sign-in did not work. Try again.') : undefined}
      />
      <p className="text-center text-xs leading-[18px] text-muted-foreground">
        No password. The link works once and expires in 15 minutes. By continuing you agree to the{' '}
        <Link href="/terms" className="underline">terms</Link> and the <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
    </div>
  );
}
