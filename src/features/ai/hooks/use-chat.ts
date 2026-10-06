'use client';

import { useCallback, useRef, useState } from 'react';
import type { AIContext, SourceRef } from '@/schemas/ai';
import { aiService } from '@/services/ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'streaming' | 'done' | 'error' | 'stopped';
  statusText?: string;
  sources: SourceRef[];
  model?: string;
  error?: string;
}

let counter = 0;
const nextId = () => `msg_${Date.now().toString(36)}_${counter++}`;

/**
 * Chat state machine over the NDJSON stream: optimistic user message,
 * incremental assistant tokens, tool status, citations, abort and retry.
 * Lives in component state (not global) so each chat surface is isolated.
 */
export function useChat(context: AIContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const isStreaming = messages.at(-1)?.status === 'streaming';

  const patch = useCallback((id: string, update: (m: ChatMessage) => Partial<ChatMessage>) => {
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...update(m) } : m)));
  }, []);

  const run = useCallback(
    async (history: ChatMessage[]) => {
      const assistantId = nextId();
      setMessages([...history, { id: assistantId, role: 'assistant', content: '', status: 'streaming', statusText: 'Thinking…', sources: [] }]);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const payload = history.filter((m) => m.status !== 'error' && m.content).map((m) => ({ role: m.role, content: m.content }));
        for await (const event of aiService.chat({ messages: payload, context }, controller.signal)) {
          if (event.type === 'status') patch(assistantId, () => ({ statusText: event.message }));
          else if (event.type === 'sources') patch(assistantId, () => ({ sources: event.sources }));
          else if (event.type === 'text') patch(assistantId, (m) => ({ content: m.content + event.delta, statusText: undefined }));
          else if (event.type === 'done') patch(assistantId, () => ({ status: 'done', model: event.model, statusText: undefined }));
          else if (event.type === 'error') patch(assistantId, () => ({ status: 'error', error: event.message, statusText: undefined }));
        }
        patch(assistantId, (m) => (m.status === 'streaming' ? { status: 'done', statusText: undefined } : {}));
      } catch (error) {
        if (controller.signal.aborted) patch(assistantId, () => ({ status: 'stopped', statusText: undefined }));
        else patch(assistantId, () => ({ status: 'error', statusText: undefined, error: error instanceof Error ? error.message : 'Request failed' }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [context, patch],
  );

  const send = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text || isStreaming) return;
      void run([...messages, { id: nextId(), role: 'user', content: text, status: 'done', sources: [] }]);
    },
    [messages, isStreaming, run],
  );

  /** Re-runs the last user turn, dropping the failed/stopped answer. */
  const retry = useCallback(() => {
    const lastUser = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUser < 0 || isStreaming) return;
    void run(messages.slice(0, lastUser + 1));
  }, [messages, isStreaming, run]);

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  return { messages, isStreaming, send, retry, stop, reset };
}
