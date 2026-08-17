import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/auth';
import { cn, initials } from '@/lib/utils';
import { getConversation } from '@/features/messages/queries';
import { MessageComposer } from '@/features/messages/message-composer';
import { MarkConversationRead } from '@/features/messages/mark-read';

export const metadata = { title: 'Conversation' };

/** Thread view: a one-to-one message history with an inline composer. */
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const thread = await getConversation(id, userId);
  if (!thread) notFound();

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-2xl flex-col">
      <MarkConversationRead conversationId={thread.id} />

      <header className="flex items-center gap-3 border-b pb-3">
        <Link href="/messages" aria-label="Back to messages" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/u/${thread.other.id}`} className="flex items-center gap-2">
          <Avatar className="size-8">
            {thread.other.avatarUrl ? <AvatarImage src={thread.other.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(thread.other.name)}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{thread.other.name}</span>
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-4">
        {thread.messages.length === 0 ? (
          <p className="m-auto text-sm text-muted-foreground">
            No messages yet. Say hello to {thread.other.name}.
          </p>
        ) : (
          thread.messages.map((message) => {
            const isMine = message.senderId === userId;
            return (
              <div
                key={message.id}
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                <span
                  className={cn(
                    'max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm',
                    isMine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {message.body}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t pt-3">
        <MessageComposer conversationId={thread.id} />
      </div>
    </div>
  );
}
