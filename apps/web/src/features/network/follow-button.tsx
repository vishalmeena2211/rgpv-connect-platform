'use client';

import { useState, useTransition } from 'react';
import { Check, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { toggleFollow } from './connection-actions';

/** Follow / following toggle with optimistic state and error rollback. */
export function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const previous = following;
    setFollowing(!previous);
    startTransition(async () => {
      const result = await toggleFollow(targetUserId);
      if (!result.ok) {
        setFollowing(previous);
        toast.error(result.error);
      } else {
        setFollowing(result.following);
      }
    });
  }

  return (
    <Button
      variant={following ? 'outline' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {following ? <Check /> : <UserPlus />}
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
