'use client';

import { useState, useTransition } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { reportListing } from '@/features/marketplace/listing-actions';

import { reportPost } from './post-actions';

const REASONS = [
  ['OFF_TOPIC', 'Not about college or studies'],
  ['SPAM', 'Spam or selling something'],
  ['HARASSMENT', 'Harassment or abuse'],
  ['PERSONAL_INFO', 'Someone’s personal information'],
  ['OTHER', 'Something else'],
] as const;

type Reason = (typeof REASONS)[number][0];

/** Reasons as big radio rows; the reporter is never shown to the author. */
export function ReportDialog({
  target,
  trigger,
}: {
  target: { kind: 'post' | 'listing'; id: string; ownerName: string };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>('OFF_TOPIC');
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();
  const what = target.kind === 'post' ? 'post' : 'listing';

  function submit() {
    startTransition(async () => {
      const result = target.kind === 'post' ? await reportPost(target.id, { reason, note }) : await reportListing(target.id, { reason, note });
      if (result.ok) {
        toast.success('Reported. A reviewer looks within a day.');
        setOpen(false);
      } else toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm">
            <Flag />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Report {target.ownerName}’s {what}?
          </DialogTitle>
          <DialogDescription>
            A reviewer looks at it within a day. {target.ownerName.split(' ')[0]} is not told who reported it.
          </DialogDescription>
        </DialogHeader>
        <div role="radiogroup" className="overflow-hidden rounded-md border">
          {REASONS.map(([value, label]) => (
            <label key={value} className={cn('flex cursor-pointer items-center gap-3 border-b px-3.5 py-3 text-sm last:border-b-0', reason === value && 'bg-accent')}>
              <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="size-4 accent-[rgb(var(--primary))]" />
              {label}
            </label>
          ))}
        </div>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Anything else the reviewer should know (optional)" aria-label="Note for the reviewer" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Back
          </Button>
          <Button variant="destructive" disabled={pending} onClick={submit}>
            {pending ? <Loader2 className="animate-spin" /> : <Flag />}
            Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
