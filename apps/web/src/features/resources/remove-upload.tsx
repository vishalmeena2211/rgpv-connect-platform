'use client';

import { useState, useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { removeResource } from './actions';

export function RemoveUploadButton({ id, title, published }: { id: string; title: string; published: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label={`Remove ${title}`}>
          <Trash2 />
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove “{title}”?</DialogTitle>
          <DialogDescription>
            {published ? 'It disappears from Notes and Papers for everyone, with its ratings. ' : ''}The file is deleted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep it
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await removeResource(id);
                if (result.ok) {
                  toast.success('Removed.');
                  setOpen(false);
                } else toast.error(result.error);
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
