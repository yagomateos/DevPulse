'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage as Message } from '../hooks/use-chat';
import { ChatMessage } from './chat-message';

export function MessageList({ messages, userName, onRetry }: { messages: Message[]; userName: string; onRetry: () => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages.at(-1);
  // Follow the stream, but only scroll the list container (never the page).
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, last?.content.length, last?.statusText]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
      <ol className="space-y-5" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
        {messages.map((m, i) => (
          <ChatMessage key={m.id} message={m} userName={userName} isLast={i === messages.length - 1} onRetry={onRetry} />
        ))}
      </ol>
      <div ref={endRef} />
    </div>
  );
}
