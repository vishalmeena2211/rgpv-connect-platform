'use client';

import { useActionState } from 'react';
import { Loader2, Mail, Smartphone } from 'lucide-react';
import { track } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

import { emailSignIn, googleSignIn, type SignInState } from './actions';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-7.9z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

/** Email link first (most students have no college Google account), Google second. */
export function SignInForm({ callbackUrl, googleEnabled, error }: { callbackUrl: string; googleEnabled: boolean; error?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(emailSignIn, error ? { error } : undefined);

  return (
    <div className="flex flex-col gap-3.5">
      <form action={action} onSubmit={() => track('Sign-in link requested')} className="flex flex-col gap-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field label="College or personal email" htmlFor="email" error={state?.error}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="name@gmail.com" className="h-12 pl-9 text-[15px]" aria-invalid={Boolean(state?.error)} />
          </div>
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Email me a sign-in link
        </Button>
      </form>
      <div className="flex items-center gap-2.5 text-xs text-faint">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      {googleEnabled ? (
        <form action={googleSignIn} onSubmit={() => track('Google sign-in started')}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="outline" size="lg" className="w-full">
            <GoogleMark />
            Continue with Google
          </Button>
        </form>
      ) : (
        <Button variant="outline" size="lg" className="w-full" disabled title="Google sign-in is not set up on this server">
          <GoogleMark />
          Continue with Google
        </Button>
      )}
      <Button variant="outline" size="lg" className="w-full" disabled title="Phone sign-in comes after launch">
        <Smartphone />
        Continue with phone · later
      </Button>
    </div>
  );
}
