'use client';

import { useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { likePost } from './post-actions';

/** Like control with an optimistic count bump while the server action runs. */
export function LikeButton({ postId, count }: { postId: string; count: number }) {
  const [optimisticCount, addOptimistic] = useOptimistic(count, (current) => current + 1);
  const [, startTransition] = useTransition();

  function handleLike() {
    startTransition(async () => {
      addOptimistic(null);
      await likePost(postId);
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLike} className="gap-1.5 text-muted-foreground">
      <Heart className="size-4" />
      <span className="tabular-nums">{optimisticCount}</span>
    </Button>
  );
}
