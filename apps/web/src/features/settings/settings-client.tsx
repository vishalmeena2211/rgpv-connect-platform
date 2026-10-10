'use client';

import { useActionState, useOptimistic, useState, useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/input';

import { cancelDeletion, type Preference, requestDeletion, setPreference, updateBio } from './actions';

export function PreferenceRow({ name, label, hint, initial }: { name: Preference; label: string; hint?: string; initial: boolean }) {
  const [on, setOn] = useOptimistic(initial);
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
      <span>
        <span className="block text-[13px] font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            setOn(next);
            await setPreference(name, next);
          });
        }}
      />
    </label>
  );
}

export function BioForm({ initial }: { initial: string }) {
  const [state, action, pending] = useActionState(updateBio, undefined);
  return (
    <form action={action} className="flex flex-col gap-2.5">
      <Field label="About you" htmlFor="bio" hint="Shown on your profile. 280 characters." error={state && !state.ok ? state.error : undefined}>
        <Textarea id="bio" name="bio" defaultValue={initial} maxLength={280} placeholder="CS 2028 at UIT. Likes algorithms and badminton." />
      </Field>
      <Button type="submit" size="sm" variant="outline" className="self-start" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {state?.ok ? 'Saved' : 'Save'}
      </Button>
    </form>
  );
}

export function DeletionControl({ pendingUntil }: { pendingUntil: string | null }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();

  if (pendingUntil) {
    return (
      <div className="flex flex-col items-start gap-2.5">
        <p className="text-[13px]">
          Your account will be deleted after <b>{pendingUntil}</b>. Until then you can change your mind.
        </p>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => { await cancelDeletion(); toast.success('Deletion cancelled.'); })}>
          Cancel deletion
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive-outline" size="sm">
          <Trash2 />
          Delete my account and data…
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account and everything in it?</DialogTitle>
          <DialogDescription>
            Your account, saved results, messages, posts and uploads are deleted after seven days. Until then you can cancel
            from this page. Your enrollment number is freed, so you can verify again later.
          </DialogDescription>
        </DialogHeader>
        <Field label="Why are you leaving? (optional)" htmlFor="delete-reason">
          <Textarea id="delete-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep my account
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await requestDeletion(reason);
                setOpen(false);
                toast.success('Deletion requested. You have seven days to cancel.');
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete after seven days
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
