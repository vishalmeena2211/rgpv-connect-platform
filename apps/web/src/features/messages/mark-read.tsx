'use client';

import { useEffect } from 'react';

import { markConversationRead } from './actions';

/**
 * Side-effecting marker: advances the viewer's read cursor once the thread is
 * on screen, clearing its unread state and the top-bar badge.
 */
export function MarkConversationRead({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  return null;
}
