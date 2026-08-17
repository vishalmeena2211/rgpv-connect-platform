import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { batchTag, initials, relativeTime } from '@/lib/utils';

import { type FeedPost } from './feed-queries';
import { LikeButton } from './like-button';

/** A single feed post: author header, body, and like / comment actions. */
export function PostCard({ post }: { post: FeedPost }) {
  const tag = batchTag(post.author.branchCode, post.author.graduatingBatch);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Link href={`/u/${post.author.id}`}>
          <Avatar>
            {post.author.avatarUrl ? <AvatarImage src={post.author.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/u/${post.author.id}`} className="truncate font-medium hover:underline">
              {post.author.name}
            </Link>
            {tag ? (
              <Badge variant="secondary" className="shrink-0">
                {tag}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {post.scope === 'UNIVERSITY' ? 'All RGPV' : 'College'} · {relativeTime(post.createdAt)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-sm">{post.body}</p>
        <div className="flex items-center gap-1">
          <LikeButton postId={post.id} count={post.likeCount} />
          <span className="inline-flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
            <MessageCircle className="size-4" />
            <span className="tabular-nums">{post.commentCount}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
