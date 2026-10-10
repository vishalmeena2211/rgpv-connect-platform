'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Check, Loader2, Play, RefreshCw, Square, Trash2, X, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

import {
  checkDeclaration,
  completeDeletion,
  dismissListingReports,
  publishResource,
  rejectResource,
  removePost,
  resolveDispute,
  restorePost,
  saveCohortSize,
  setRole,
  startDeclaration,
  stepDeclaration,
  stopDeclaration,
  triggerParserCheck,
  triggerWarmPool,
} from './actions';
import type { SampleCheck } from './results-day';

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(result.error ?? 'That did not work.');
    });
  return { pending, run };
}

export function ResourceDecision({ id }: { id: string }) {
  const [note, setNote] = useState('');
  const { pending, run } = useAction();
  return (
    <div className="flex flex-col gap-3">
      <Field label="Note to the uploader (shown if you don’t publish)" htmlFor="review-note">
        <Textarea id="review-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why it was not published and what would fix it" maxLength={500} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="destructive-outline" disabled={pending} onClick={() => run(() => rejectResource(id, note), 'Sent back with your note.')}>
          <X />
          Don’t publish
        </Button>
        <Button disabled={pending} onClick={() => run(() => publishResource(id), 'Published.')}>
          {pending ? <Loader2 className="animate-spin" /> : <Check />}
          Publish
        </Button>
      </div>
    </div>
  );
}

export function PostDecision({ id }: { id: string }) {
  const [reason, setReason] = useState('');
  const { pending, run } = useAction();
  return (
    <div className="flex flex-col gap-3">
      <Field label="Reason (sent to the author if you remove it)" htmlFor="remove-reason">
        <Textarea id="remove-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Selling exam answers is not allowed." />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={pending} onClick={() => run(() => restorePost(id), 'Restored.')}>
          Restore post
        </Button>
        <Button variant="destructive" disabled={pending} onClick={() => run(() => removePost(id, reason), 'Removed.')}>
          {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
          Remove post
        </Button>
      </div>
    </div>
  );
}

export function ListingDecision({ id }: { id: string }) {
  const { pending, run } = useAction();
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" disabled={pending} onClick={() => run(() => dismissListingReports(id, false), 'Kept.')}>
        Keep listing
      </Button>
      <Button variant="destructive" disabled={pending} onClick={() => run(() => dismissListingReports(id, true), 'Listing removed.')}>
        <Trash2 />
        Remove listing
      </Button>
    </div>
  );
}

type Run = { id: string; processed: number; total: number; fetched: number; failed: number };

/**
 * Declare a semester for a batch: sample five numbers, confirm, then fetch and
 * notify in small steps while this page is open (the cron route continues if
 * it is closed).
 */
export function DeclareRunner({ batches, running }: { batches: number[]; running: Run | null }) {
  const router = useRouter();
  const [semester, setSemester] = useState(4);
  const [batch, setBatch] = useState(batches[0] ?? new Date().getFullYear() - 2);
  const [check, setCheck] = useState<{ sample: SampleCheck; students: number } | null>(null);
  const [byHand, setByHand] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [run, setRun] = useState<Run | null>(running);
  const [pending, startTransition] = useTransition();
  const stopRef = useRef(false);

  useEffect(() => {
    if (!run || run.processed >= run.total) return;
    stopRef.current = false;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled && !stopRef.current) {
        const step = await stepDeclaration(run.id);
        if (!step.ok) break;
        setRun({ id: run.id, processed: step.processed, total: step.total, fetched: step.fetched, failed: step.failed });
        if (!step.more) {
          toast.success('Results day run finished.');
          router.refresh();
          break;
        }
      }
    };
    void loop();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id]);

  if (run) {
    const pct = run.total ? (run.processed / run.total) * 100 : 100;
    return (
      <div className="flex flex-col gap-3">
        <p className="font-display text-sm font-bold">Fetching and notifying</p>
        <Progress value={pct} />
        <p className="text-[13px] text-muted-foreground tabular">
          {run.processed} of {run.total} students · {run.fetched} fetched · {run.failed} told to try again
        </p>
        <p className="text-xs text-muted-foreground">Keep this page open to go faster. If you close it, the scheduled job carries on every minute.</p>
        <Button
          variant="destructive-outline"
          className="self-start"
          onClick={() =>
            startTransition(async () => {
              stopRef.current = true;
              await stopDeclaration(run.id);
              setRun(null);
              router.refresh();
            })
          }
        >
          <Square />
          Stop the run
        </Button>
      </div>
    );
  }

  const allFound = check && check.sample.checked > 0 && check.sample.found === check.sample.checked;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Semester" htmlFor="declare-semester">
          <Select id="declare-semester" value={semester} onChange={(e) => { setSemester(Number(e.target.value)); setCheck(null); }}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Semester {n}</option>)}
          </Select>
        </Field>
        <Field label="Batch" htmlFor="declare-batch">
          <Select id="declare-batch" value={batch} onChange={(e) => { setBatch(Number(e.target.value)); setCheck(null); }}>
            {batches.map((year) => <option key={year} value={year}>Admitted {year} (batch {year + 4})</option>)}
          </Select>
        </Field>
      </div>
      {check ? (
        <div className="flex flex-col gap-2 rounded-md border bg-subtle p-3 text-[13px]">
          <p className="flex items-center gap-2">
            {allFound ? <Check className="size-4 text-success" /> : <X className="size-4 text-destructive" />}
            Portal returns semester {semester} for {check.sample.found} of {check.sample.checked} sample numbers from this batch
          </p>
          <p className="flex items-center gap-2"><Check className="size-4 text-success" />{check.students} verified students in this batch</p>
        </div>
      ) : null}
      {check && allFound ? (
        <Callout tone="info" title={`Sending fetches ${check.students} results, then notifies everyone who allows it`}>
          Fetches run a few at a time so RGPV’s portal is not hammered. Students whose fetch fails get the notification with “tap to try again”.
        </Callout>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await checkDeclaration({ semester, admissionYear: batch });
              if (result.ok) setCheck({ sample: result.sample, students: result.students });
              else toast.error(result.error);
            })
          }
        >
          {pending && !check ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Check the portal
        </Button>
        <Dialog open={confirming} onOpenChange={setConfirming}>
          <DialogTrigger asChild>
            <Button disabled={!allFound}>
              <Zap />
              Fetch and notify…
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Fetch semester {semester} for batch {batch + 4} and notify {check?.students ?? 0} students?
              </DialogTitle>
              <DialogDescription>Notifications go out as each result is saved. This cannot be unsent.</DialogDescription>
            </DialogHeader>
            <Checkbox id="declare-by-hand" checked={byHand} onChange={(e) => setByHand(e.target.checked)} label="I checked the portal myself for at least one number from this batch" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirming(false)}>Back</Button>
              <Button
                disabled={!byHand || pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await startDeclaration({ semester, admissionYear: batch, sample: check!.sample, checkedByHand: byHand });
                    if (!result.ok) return void toast.error(result.error);
                    setConfirming(false);
                    setRun({ id: result.id, processed: 0, total: check!.students, fetched: 0, failed: 0 });
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <Play />}
                Fetch and notify
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {!allFound && check ? <p className="text-xs text-destructive">All five samples need a result before you can send. The semester is probably not fully declared yet.</p> : null}
    </div>
  );
}

export function WorkerButtons() {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          run(async () => {
            const result = await triggerParserCheck();
            if (result.ok && !result.healthy) return { ok: false, error: `Parser check failed: ${result.detail}` };
            return result;
          }, 'Parser check passed.')
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        Run the live check now
      </Button>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => run(triggerWarmPool, 'Warming sessions for the next ten minutes.')}>
        <Zap />
        Warm the session pool
      </Button>
    </div>
  );
}

export function CompleteDeletionButton({ id, label, eligible }: { id: string; label: string; eligible: boolean }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAction();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive-outline" size="sm" disabled={!eligible} title={eligible ? undefined : 'The seven-day wait is not over'}>
          <Trash2 />
          Delete now…
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {label}?</DialogTitle>
          <DialogDescription>
            This removes the account, saved results, messages, posts, uploads and their files. The request stays in the log without personal details. Recorded with your name and the time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Back</Button>
          <Button variant="destructive" disabled={pending} onClick={() => run(() => completeDeletion(id), 'Deleted.')}>
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DisputeDecision({ id, holder, claimant }: { id: string; holder: string; claimant: string }) {
  const [note, setNote] = useState('');
  const { pending, run } = useAction();
  return (
    <div className="flex flex-col gap-2">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you checked (kept in the log)" aria-label="Decision note" className="min-h-[56px]" />
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => resolveDispute(id, 'KEPT', note), `${holder} keeps the number.`)}>
          {holder} keeps it
        </Button>
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => resolveDispute(id, 'RELEASED', note), `Released for ${claimant}.`)}>
          Release it for {claimant}
        </Button>
      </div>
    </div>
  );
}

export function CohortSizeForm({ collegeCodes }: { collegeCodes: string[] }) {
  const { pending, run } = useAction();
  const [college, setCollege] = useState(collegeCodes[0] ?? '0151');
  const [branch, setBranch] = useState('CS');
  const [batch, setBatch] = useState(new Date().getFullYear() + 2);
  const [size, setSize] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveCohortSize({ collegeCode: college, branchCode: branch, graduatingBatch: batch, size: Number(size) }), 'Saved.');
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <Field label="College code" htmlFor="cs-college"><Input id="cs-college" value={college} onChange={(e) => setCollege(e.target.value)} className="w-24 tabular" /></Field>
      <Field label="Branch" htmlFor="cs-branch"><Input id="cs-branch" value={branch} onChange={(e) => setBranch(e.target.value.toUpperCase().slice(0, 2))} className="w-16" /></Field>
      <Field label="Batch" htmlFor="cs-batch"><Input id="cs-batch" inputMode="numeric" value={batch} onChange={(e) => setBatch(Number(e.target.value))} className="w-24 tabular" /></Field>
      <Field label="Students" htmlFor="cs-size"><Input id="cs-size" inputMode="numeric" value={size} onChange={(e) => setSize(e.target.value)} className="w-24 tabular" /></Field>
      <Button type="submit" disabled={pending || !size}>Save</Button>
    </form>
  );
}

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const { pending, run } = useAction();
  return (
    <Select
      aria-label="Role"
      value={role}
      disabled={pending}
      onChange={(e) => run(() => setRole(userId, e.target.value as 'STUDENT'), 'Role changed.')}
      className="h-8 w-36"
    >
      <option value="STUDENT">Student</option>
      <option value="RECRUITER">Recruiter</option>
      <option value="MENTOR">Mentor</option>
      <option value="ADMIN">Admin</option>
    </Select>
  );
}
