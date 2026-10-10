'use client';

import { useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { markListingSold } from './listing-actions';

export function MarkSoldButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="lg"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markListingSold(id);
          if (result.ok) toast.success('Marked sold.');
          else toast.error(result.error);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Check />}
      Mark as sold
    </Button>
  );
}
