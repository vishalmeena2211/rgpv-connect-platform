import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkConversationRead } from '@/features/messages/mark-read';
import { MessageComposer } from '@/features/messages/message-composer';
import { getConversation } from '@/features/messages/queries';
import { requireUser } from '@/lib/session';
import { batchTag, cn, formatWhen, initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  const thread = await getConversation(id, user.id);
  if (!thread) notFound();

  const lastMine = [...thread.messages].reverse().find((m) => m.senderId === user.id);
  const seen = lastMine && thread.otherLastReadAt && thread.otherLastReadAt >= lastMine.createdAt;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MarkConversationRead conversationId={thread.id} />
      <header className="flex items-center gap-2.5 border-b px-3 py-2.5 sm:px-4">
        <Link href="/messages" aria-label="Back to messages" className="grid size-9 place-items-center rounded-lg border md:hidden">
          <ChevronLeft className="size-4" />
        </Link>
        <Avatar>
          {thread.other.avatarUrl ? <AvatarImage src={thread.other.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(thread.other.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold">
            {thread.other.name}
            {thread.other.verificationStatus === 'VERIFIED' ? <Badge variant="verified">Verified</Badge> : null}
          </p>
          <p className="text-xs text-muted-foreground">{batchTag(thread.other.branchCode, thread.other.graduatingBatch) ?? ''}</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link href={`/u/${thread.other.id}`}>
            <User />
            Profile
          </Link>
        </Button>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-subtle p-4">
        {thread.messages.length === 0 ? (
          <p className="m-auto text-[13px] text-muted-foreground">No messages yet. Say hello to {thread.other.name.split(' ')[0]}.</p>
        ) : (
          thread.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                <p
                  className={cn(
                    'max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[13px] leading-[19px]',
                    mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-card',
                  )}
                >
                  {m.body}
                </p>
                <span className="mt-0.5 text-[10px] text-faint">
                  {formatWhen(m.createdAt)}
                  {m === lastMine && seen ? ' · read' : ''}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t p-3 sm:px-4">
        <MessageComposer conversationId={thread.id} />
      </div>
    </div>
  );
}
