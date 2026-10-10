import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { batchTag, initials } from '@/lib/utils';

import type { DirectoryUser } from './directory-queries';
import { FollowButton } from './follow-button';

export function PersonRow({ user }: { user: DirectoryUser }) {
  const line = [batchTag(user.branchCode, user.graduatingBatch), user.collegeShortName, user.notesShared ? `shared ${user.notesShared} note${user.notesShared === 1 ? '' : 's'}` : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-card">
      <Avatar className="size-9">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <Link href={`/u/${user.id}`} className="flex items-center gap-1.5 text-[13px] font-semibold hover:underline">
          <span className="truncate">{user.name}</span>
          <Badge variant="verified">Verified</Badge>
        </Link>
        <p className="truncate text-xs text-muted-foreground">{line}</p>
      </div>
      <FollowButton targetUserId={user.id} initialFollowing={user.isFollowing} />
    </li>
  );
}
