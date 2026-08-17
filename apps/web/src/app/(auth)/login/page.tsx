import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Sign in' };

/**
 * Sign-in page. Google is the primary method; phone OTP is the planned second
 * option (its provider is wired separately). After sign-in, new users are sent
 * through enrollment verification at /onboarding.
 */
export default function LoginPage() {
  async function signInWithGoogle() {
    'use server';
    await signIn('google', { redirectTo: '/onboarding' });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </div>
          <CardTitle className="text-2xl">Join RGPV Connect</CardTitle>
          <CardDescription>
            Sign in, then verify your enrollment to unlock your college network.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={signInWithGoogle}>
            <Button type="submit" className="w-full" size="lg">
              Continue with Google
            </Button>
          </form>
          <Button variant="outline" className="w-full" size="lg" disabled>
            Continue with phone (coming soon)
          </Button>
          <p className="px-2 text-center text-xs text-muted-foreground">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
