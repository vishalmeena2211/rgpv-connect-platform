'use client';

import { useState, useTransition } from 'react';
import { type PostScope } from '@rgpv/shared';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { initials } from '@/lib/utils';

import { createPost } from './post-actions';

/**
 * Inline post composer for the home feed. Lets a verified user write a post and
 * choose its audience (their college vs. the whole university). On success the
 * server action revalidates the feed, so the new post appears without a manual
 * refresh.
 */
export function Composer({ author }: { author: { name: string; avatarUrl: string | null } }) {
  const [body, setBody] = useState('');
  const [scope, setScope] = useState<PostScope>('COLLEGE');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await createPost(body, scope);
      if (result.ok) {
        setBody('');
        toast.success('Posted.');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar>
            {author.avatarUrl ? <AvatarImage src={author.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(author.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share something with your campus…"
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <div className="flex items-center justify-between gap-2">
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as PostScope)}
                aria-label="Post audience"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="COLLEGE">My college</option>
                <option value="UNIVERSITY">All RGPV</option>
              </select>
              <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
                <Send />
                {isPending ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
