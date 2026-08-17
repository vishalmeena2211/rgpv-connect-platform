import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { batchTag, initials } from '@/lib/utils';

import { type DirectoryUser } from './directory-queries';
import { FollowButton } from './follow-button';

/** A directory row: avatar, name, batch tag, bio snippet, and follow button. */
export function UserCard({ user }: { user: DirectoryUser }) {
  const tag = batchTag(user.branchCode, user.graduatingBatch);

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <Link href={`/u/${user.id}`}>
          <Avatar className="size-12">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/u/${user.id}`} className="truncate font-medium hover:underline">
              {user.name}
            </Link>
            {tag ? (
              <Badge variant="secondary" className="shrink-0">
                {tag}
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {user.bio || user.collegeName || 'RGPV student'}
          </p>
        </div>
        <FollowButton targetUserId={user.id} initialFollowing={user.isFollowing} />
      </CardContent>
    </Card>
  );
}
