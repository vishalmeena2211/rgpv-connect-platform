import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/auth';
import { cn, initials, relativeTime } from '@/lib/utils';
import { getConversations } from '@/features/messages/queries';

export const metadata = { title: 'Messages' };

/** Inbox: the signed-in user's conversations, most recent first. */
export default async function MessagesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const conversations = userId ? await getConversations(userId) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No conversations yet. Open someone&apos;s profile and tap Message to start one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-3 py-3">
                  <Avatar className="size-10">
                    {conversation.other.avatarUrl ? (
                      <AvatarImage src={conversation.other.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(conversation.other.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn('truncate', conversation.isUnread && 'font-semibold')}
                      >
                        {conversation.other.name}
                      </span>
                      {conversation.lastMessageAt ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {relativeTime(conversation.lastMessageAt)}
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        'truncate text-sm text-muted-foreground',
                        conversation.isUnread && 'font-medium text-foreground',
                      )}
                    >
                      {conversation.lastMessage ?? 'No messages yet'}
                    </p>
                  </div>
                  {conversation.isUnread ? (
                    <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
