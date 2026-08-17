import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { getCurrentUser, isVerified } from '@/lib/session';
import { Composer } from '@/features/network/composer';
import { getFeed } from '@/features/network/feed-queries';
import { PostCard } from '@/features/network/post-card';

export const metadata = { title: 'Home' };

/**
 * Home feed: a composer for verified users plus posts from their college and
 * the wider university. Unverified or signed-out users still see the feed but
 * are nudged to verify before they can post.
 */
export default async function FeedPage() {
  const user = await getCurrentUser();
  const posts = await getFeed(user?.collegeId ?? null);
  const canPost = isVerified(user);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="sr-only">Home</h1>

      {canPost && user ? (
        <Composer author={{ name: user.name, avatarUrl: user.avatarUrl }} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <Link href="/onboarding" className="font-medium text-primary hover:underline">
              Verify your enrollment
            </Link>{' '}
            to post and connect with batchmates.
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No posts yet. Be the first to share something with your campus.
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
