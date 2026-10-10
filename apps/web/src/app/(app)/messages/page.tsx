import type { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Messages' };

/** Desktop right pane before a conversation is chosen. */
export default function MessagesIndex() {
  return (
    <div className="hidden h-full items-center justify-center md:flex">
      <EmptyState icon={MessageCircle} title="Pick a conversation">
        Messages are one to one. Only verified students can start one; anyone can reply.
      </EmptyState>
    </div>
  );
}
