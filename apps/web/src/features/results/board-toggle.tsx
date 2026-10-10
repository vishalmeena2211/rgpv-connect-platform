'use client';

import { useOptimistic, useTransition } from 'react';

import { Switch } from '@/components/ui/checkbox';

import { setShowOnBoard } from './actions';

/** The single switch for appearing on the semester board. Off by default. */
export function BoardToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useOptimistic(initial);
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground">
      <Switch
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            setOn(next);
            await setShowOnBoard(next);
          });
        }}
      />
      Show me on the board
    </label>
  );
}
