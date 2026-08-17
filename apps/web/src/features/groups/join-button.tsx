'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { toggleGroupMembership } from './group-actions';

/** Join / leave toggle for a group, with optimistic state and rollback. */
export function JoinButton({
  groupId,
  initialMember,
}: {
  groupId: string;
  initialMember: boolean;
}) {
  const [member, setMember] = useState(initialMember);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const previous = member;
    setMember(!previous);
    startTransition(async () => {
      const result = await toggleGroupMembership(groupId);
      if (!result.ok) {
        setMember(previous);
        toast.error(result.error);
      } else {
        setMember(result.member);
      }
    });
  }

  return (
    <Button
      variant={member ? 'outline' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {member ? 'Joined' : 'Join'}
    </Button>
  );
}
