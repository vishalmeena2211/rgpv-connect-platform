'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { EyeOff, Heart, MessageSquare } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { batchTag, cn, initials, relativeTime } from '@/lib/utils';

import type { FeedPost } from './feed-queries';
import { toggleLike } from './post-actions';
import { ReportDialog } from './report-dialog';

/** One post: who (verified, batch), when, the text, likes and the report path. */
export function PostCard({ post, viewerId }: { post: FeedPost; viewerId: string | null }) {
  const [state, setState] = useOptimistic({ liked: post.likedByViewer, count: post.likeCount });
  const [, startTransition] = useTransition();
  const tag = batchTag(post.author.branchCode, post.author.graduatingBatch);
  const isOwn = viewerId === post.author.id;

  return (
    <article className="flex flex-col gap-2.5 rounded-lg border bg-card px-[18px] py-4 shadow-card">
      {post.hidden ? (
        <p className="flex items-center gap-2 rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-foreground">
          <EyeOff className="size-3.5" />
          Hidden while a reviewer looks at it. Only you can see it.
        </p>
      ) : null}
      <header className="flex items-center gap-2.5">
        <Link href={`/u/${post.author.id}`}>
          <Avatar className="size-9">
            {post.author.avatarUrl ? <AvatarImage src={post.author.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold">
            <Link href={`/u/${post.author.id}`} className="truncate hover:underline">
              {post.author.name}
            </Link>
            {post.author.verified ? <Badge variant="verified">Verified</Badge> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {[tag, post.groupName ?? post.author.collegeShortName, relativeTime(post.createdAt)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>
      <p className="whitespace-pre-wrap break-words text-[13.5px] leading-[21px]">{post.body}</p>
      <footer className="flex items-center gap-1 text-xs text-muted-foreground">
        <button
          type="button"
          disabled={!viewerId}
          onClick={() =>
            startTransition(async () => {
              setState({ liked: !state.liked, count: state.count + (state.liked ? -1 : 1) });
              await toggleLike(post.id);
            })
          }
          aria-pressed={state.liked}
          className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted', state.liked && 'text-destructive')}
        >
          <Heart className={cn('size-[15px]', state.liked && 'fill-current')} />
          <span className="tabular">{state.count}</span>
        </button>
        <span className="inline-flex items-center gap-1.5 px-2 py-1">
          <MessageSquare className="size-[15px]" />
          <span className="tabular">{post.commentCount}</span>
        </span>
        {!isOwn && viewerId ? (
          <span className="ml-auto">
            <ReportDialog target={{ kind: 'post', id: post.id, ownerName: post.author.name }} />
          </span>
        ) : null}
      </footer>
    </article>
  );
}
