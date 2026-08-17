import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/auth';
import { batchTag, initials } from '@/lib/utils';
import { FollowButton } from '@/features/network/follow-button';
import { PostCard } from '@/features/network/post-card';
import { getProfile } from '@/features/network/profile-queries';
import { startConversation } from '@/features/messages/actions';

/** Headline count (followers / following) shown under the profile name. */
function CountStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-sm">
      <span className="font-bold tabular-nums">{value}</span>{' '}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

/** Public profile page: identity header, follow action, and recent posts. */
export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const profile = await getProfile(id, session?.user?.id ?? null);

  if (!profile) notFound();

  const tag = batchTag(profile.branchCode, profile.graduatingBatch);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-lg">{initials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{profile.name}</h1>
                {tag ? <Badge variant="secondary">{tag}</Badge> : null}
              </div>
              {profile.collegeName ? (
                <p className="text-sm text-muted-foreground">{profile.collegeName}</p>
              ) : null}
              <div className="flex gap-4 pt-1">
                <CountStat label="followers" value={profile.followerCount} />
                <CountStat label="following" value={profile.followingCount} />
              </div>
            </div>
            {!profile.isSelf ? (
              <div className="flex shrink-0 items-center gap-2">
                <FollowButton targetUserId={profile.id} initialFollowing={profile.isFollowing} />
                <form action={startConversation.bind(null, profile.id)}>
                  <Button type="submit" variant="outline" size="sm" aria-label="Message">
                    <MessageCircle />
                    Message
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
          {profile.bio ? <p className="text-sm">{profile.bio}</p> : null}
        </CardContent>
      </Card>

      {profile.posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {profile.isSelf ? "You haven't" : `${profile.name} hasn't`} posted yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {profile.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
