import { MessageCircle } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { getConversations } from '@/features/messages/queries';
import { ThreadList } from '@/features/messages/thread-list';
import { MessagesPanes } from '@/features/messages/panes';
import { requireUser } from '@/lib/session';

/** Two panes on desktop (inbox + conversation); one at a time on phones. */
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/messages');
  const conversations = await getConversations(user.id);
  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="sr-only">Messages</h1>
      <MessagesPanes
        list={
          conversations.length === 0 ? (
            <EmptyState icon={MessageCircle} title="No conversations yet">
              Open a senior’s profile from a note they shared and tap Message.
            </EmptyState>
          ) : (
            <ThreadList conversations={conversations} />
          )
        }
      >
        {children}
      </MessagesPanes>
    </div>
  );
}
