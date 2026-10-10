'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChipButton } from '@/components/ui/chip';
import { Textarea } from '@/components/ui/input';
import { initials } from '@/lib/utils';

import { createPost } from './post-actions';

/** Ask your college something, or just your batch. */
export function Composer({
  author,
  collegeLabel,
  cohort,
}: {
  author: { name: string; avatarUrl: string | null };
  collegeLabel: string;
  cohort: { id: string; label: string } | null;
}) {
  const [body, setBody] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-3 rounded-lg border bg-card px-4 py-3.5 shadow-card">
      <Avatar className="size-9">
        {author.avatarUrl ? <AvatarImage src={author.avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials(author.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="Ask your college something, or share what you found…" aria-label="Write a post" className="min-h-[64px]" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <ChipButton on={groupId === null} onClick={() => setGroupId(null)}>
              {collegeLabel}
            </ChipButton>
            {cohort ? (
              <ChipButton on={groupId === cohort.id} onClick={() => setGroupId(cohort.id)}>
                {cohort.label} only
              </ChipButton>
            ) : null}
          </div>
          <Button
            size="sm"
            disabled={pending || !body.trim()}
            onClick={() =>
              startTransition(async () => {
                const result = await createPost(body, groupId);
                if (result.ok) {
                  setBody('');
                  toast.success('Posted.');
                } else toast.error(result.error);
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
