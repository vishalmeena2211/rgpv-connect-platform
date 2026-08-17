'use client';

import { useRef, useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { sendMessage } from './actions';

/** Bottom-docked input for sending a message within a thread. */
export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody('');
    startTransition(async () => {
      const result = await sendMessage(conversationId, text);
      if (!result.ok) {
        setBody(text);
        toast.error(result.error);
      }
      inputRef.current?.focus();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write a message…"
        maxLength={4000}
        aria-label="Message"
      />
      <Button type="submit" size="icon" disabled={isPending || !body.trim()} aria-label="Send">
        <Send className="size-5" />
      </Button>
    </form>
  );
}
