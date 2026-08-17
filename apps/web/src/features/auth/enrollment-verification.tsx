'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { confirmEnrollment, previewEnrollment, type EnrollmentPreview } from './actions';

/**
 * Two-step enrollment verification used during onboarding:
 *  1. Enter enrollment + semester → we fetch the RGPV result and show the name.
 *  2. Confirm "this is me" → the enrollment is bound to the account.
 */
export function EnrollmentVerification() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState('');
  const [semester, setSemester] = useState('1');
  const [preview, setPreview] = useState<Extract<EnrollmentPreview, { ok: true }> | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLookup() {
    startTransition(async () => {
      const res = await previewEnrollment(enrollment, Number(semester));
      if (res.ok) setPreview(res);
      else toast.error(res.error);
    });
  }

  function handleConfirm() {
    startTransition(async () => {
      const res = await confirmEnrollment(enrollment);
      if (res.ok) {
        toast.success('Verified! Welcome to RGPV Connect.');
        router.push('/feed');
        router.refresh();
      } else {
        toast.error(res.error ?? 'Something went wrong.');
      }
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <CardTitle>Verify your enrollment</CardTitle>
        <CardDescription>
          We confirm your identity from your RGPV result — this auto-fills your college, branch and
          batch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preview ? (
          <>
            <div className="space-y-1.5">
              <label htmlFor="enrollment" className="text-sm font-medium">
                Enrollment number
              </label>
              <Input
                id="enrollment"
                placeholder="0151CS21001"
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value.toUpperCase())}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="semester" className="text-sm font-medium">
                Any semester you have a result for
              </label>
              <Input
                id="semester"
                type="number"
                min={1}
                max={8}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleLookup} disabled={isPending || !enrollment}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Look up my result
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="size-5" />
                <span className="text-sm font-medium">Is this you?</span>
              </div>
              <p className="mt-2 text-lg font-semibold">{preview.name}</p>
              <p className="text-sm text-muted-foreground">
                {preview.branch} · College {preview.college} · Batch {preview.batch}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>
                Not me
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Yes, that&apos;s me
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
