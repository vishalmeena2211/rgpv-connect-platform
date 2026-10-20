'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Building2, Check, CheckCircle2, Loader2, Search, ShieldCheck } from 'lucide-react';
import { COURSE_SEMESTERS, latestDeclaredSemester, parseEnrollment } from '@rgpv/shared';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { semesterTiles } from '@/components/ui/select-options';
import { useWarmLookup } from '@/features/results/use-warm-lookup';
import { formatDate } from '@/lib/utils';

import { confirmEnrollment, disputeEnrollment, type EnrollmentPreview, previewEnrollment } from './actions';

type Preview = Extract<EnrollmentPreview, { ok: true }>;
type Taken = { enrollment: string; verifiedOn: string; via: string };

function Steps({ done }: { done: number }) {
  return (
    <div className="flex justify-center gap-1.5" aria-label={`Step ${done} of 3`}>
      {[1, 2, 3].map((step) => (
        <span key={step} className={`h-1 w-7 rounded-full ${step <= done ? 'bg-primary' : 'bg-border'}`} />
      ))}
    </div>
  );
}

/**
 * Verification: enter the number (decoded live) → "is this you?" with the
 * name RGPV holds → verified. A number someone else already holds leads to a
 * claim instead of a dead end.
 */
export function VerifyFlow({
  initialEnrollment = '',
  initialSemester,
  collegeNames,
}: {
  initialEnrollment?: string;
  initialSemester?: number;
  collegeNames: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initialEnrollment);
  const warm = useWarmLookup();
  const [semester, setSemester] = useState<number | 'auto'>(initialSemester ?? 'auto');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [taken, setTaken] = useState<Taken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const parsed = useMemo(() => parseEnrollment(value), [value]);
  const latest = parsed ? latestDeclaredSemester(parsed.admissionYear) : null;
  const effective = semester === 'auto' ? (latest ?? 1) : semester;

  function find() {
    if (!parsed) {
      setError('That does not look like an RGPV enrollment number. It looks like 0151CS241042.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await previewEnrollment(parsed.raw, effective);
      if (result.ok) setPreview(result);
      else if (result.takenBy) setTaken({ enrollment: parsed.raw, ...result.takenBy });
      else setError(result.error);
    });
  }

  function confirm() {
    if (!preview) return;
    startTransition(async () => {
      const result = await confirmEnrollment(preview.enrollment, preview.semester);
      if (result.ok) {
        track('Enrollment verified');
        router.push('/welcome');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Something went wrong.');
      }
    });
  }

  if (taken) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">This number is already linked to another account</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {taken.enrollment} was verified on {formatDate(taken.verifiedOn)} by an account that signs in with {taken.via}.
          </p>
        </div>
        <Steps done={2} />
        <Callout tone="warning" title="Only one account per enrollment number">
          If that account is yours, sign in with it instead. If someone else claimed your number, tell us and we will check
          with RGPV’s record and release it.
        </Callout>
        <Field label="Anything that helps us check (optional)" htmlFor="claim-note">
          <Textarea id="claim-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: I never made an account before today." maxLength={1000} />
        </Field>
        <Button size="lg" disabled={pending} onClick={() => startTransition(async () => { await disputeEnrollment(taken.enrollment, note); })}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          This is my number, someone else used it
        </Button>
        <Button variant="ghost" size="lg" onClick={() => { setTaken(null); setValue(''); }}>
          Try a different number
        </Button>
        <p className="text-center text-xs text-muted-foreground">Claims are checked within two days. Until then neither account can post as this student.</p>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">Is this you?</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            This is the semester {preview.semester} result RGPV holds for {preview.enrollment}.
          </p>
        </div>
        <Steps done={2} />
        <div className="flex flex-col gap-2.5 rounded-lg border bg-subtle p-4">
          <p className="flex items-center gap-2 text-[13px]">
            <CheckCircle2 className="size-4 text-success" />
            Result found on RGPV’s portal just now
          </p>
          <p className="font-display text-xl font-bold">{preview.name}</p>
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-muted-foreground">College</dt>
            <dd className="font-medium">{preview.collegeName}</dd>
            <dt className="text-muted-foreground">Branch</dt>
            <dd className="font-medium">{preview.branchName}</dd>
            <dt className="text-muted-foreground">Batch</dt>
            <dd className="font-medium tabular">
              {preview.admissionYear} to {preview.graduatingBatch}
            </dd>
            <dt className="text-muted-foreground">Semester {preview.semester}</dt>
            <dd className="font-medium tabular">
              SGPA {preview.sgpa?.toFixed(2) ?? '—'} · {preview.status === 'PASS' ? 'Pass' : preview.status.toLowerCase()}
            </dd>
          </dl>
        </div>
        <Callout tone="info" title="Confirming links this number to your account">
          Your name becomes “{preview.name}” and you join your branch, batch and college groups. One enrollment number can
          belong to one account.
        </Callout>
        <div className="grid grid-cols-[1fr_1.4fr] gap-2">
          <Button variant="outline" size="lg" disabled={pending} onClick={() => setPreview(null)}>
            Not me
          </Button>
          <Button size="lg" disabled={pending} onClick={confirm}>
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Yes, that’s me
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-[13px] bg-accent">
          <ShieldCheck className="size-5 text-accent-foreground" />
        </span>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">Verify your enrollment</h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          We fetch one of your results from RGPV to prove the number is yours. That also fills in your college, branch and
          batch.
        </p>
      </div>
      <Steps done={2} />
      <Field label="Enrollment number" htmlFor="verify-enrollment" error={error ?? undefined} hint={parsed ? 'Read from the number as you type. If these look wrong, check the number.' : undefined}>
        <Input
          id="verify-enrollment"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onFocus={warm}
          placeholder="0151CS241042"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-12 text-[15px] font-medium tabular"
          aria-invalid={Boolean(error)}
        />
      </Field>
      {parsed ? (
        <div className="-mt-1 flex flex-wrap gap-1.5 animate-fade-up">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent-strong bg-accent px-2.5 text-xs font-medium text-accent-foreground">
            <Building2 className="size-3" />
            {collegeNames[parsed.collegeCode] ?? `College ${parsed.collegeCode}`}
          </span>
          <span className="inline-flex h-7 items-center rounded-full border border-accent-strong bg-accent px-2.5 text-xs font-medium text-accent-foreground">
            {parsed.branchName}
          </span>
          <span className="inline-flex h-7 items-center rounded-full border border-accent-strong bg-accent px-2.5 text-xs font-medium text-accent-foreground">
            Admitted {parsed.admissionYear} · batch {parsed.graduatingBatch}
          </span>
        </div>
      ) : null}
      <Field label="A semester you already have a result for" htmlFor="verify-semester" hint="Picked from your admission year. Any declared semester works.">
        <Select
          id="verify-semester"
          size="lg"
          value={String(semester)}
          onValueChange={(next) => setSemester(next === 'auto' ? 'auto' : Number(next))}
          columns={4}
          contentClassName="w-[min(300px,calc(100vw-24px))]"
          options={semesterTiles(COURSE_SEMESTERS, latest, 'Latest declared')}
        />
      </Field>
      <Button size="lg" disabled={pending || !value} onClick={find}>
        {pending ? <Loader2 className="animate-spin" /> : <Search />}
        {pending ? 'Asking RGPV’s portal…' : 'Find my result'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Takes about 10 seconds. We only read the result; nothing is saved until you confirm it is you.
      </p>
    </div>
  );
}
