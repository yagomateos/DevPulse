'use client';

import { Eraser, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/components/session-provider';
import type { AIContext } from '@/schemas/ai';
import { useAIStatus } from '../hooks/use-ai-analysis';
import { useChat } from '../hooks/use-chat';
import { MessageList } from './message-list';
import { PromptInput } from './prompt-input';

const SUGGESTIONS: Record<AIContext['type'], string[]> = {
  workspace: ['Which deployment caused the latest incident?', 'Which PRs are risky?', 'What changed this week?', 'Show me recent deployment failures.'],
  project: ['Why is this project unhealthy?', 'Which PRs are risky?', 'What changed this week?'],
  pull_request: ['Summarize this pull request', 'Which PRs are risky?', 'Which deployment caused the latest incident?'],
  deployment: ['Explain this deployment', 'Show me recent deployment failures.', 'Which deployment caused the latest incident?'],
  incident: ['Which deployment caused the latest incident?', 'Summarize this incident', 'What changed this week?'],
};

interface ChatWindowProps {
  context: AIContext;
  /** Prompt to send on mount (contextual "Ask AI about…" actions). */
  initialPrompt?: string | null;
  onInitialPromptConsumed?: () => void;
  autoFocus?: boolean;
}

/** Reusable chat surface used by /ai and by the contextual side panel. */
export function ChatWindow({ context, initialPrompt, onInitialPromptConsumed, autoFocus }: ChatWindowProps) {
  const { user } = useSession();
  const { data: status } = useAIStatus();
  const chat = useChat(context);
  const { send } = chat;

  // Guard against StrictMode's double effect invocation sending twice.
  const sentPrompt = useRef<string | null>(null);
  useEffect(() => {
    if (initialPrompt && sentPrompt.current !== initialPrompt) {
      sentPrompt.current = initialPrompt;
      send(initialPrompt);
      onInitialPromptConsumed?.();
    }
  }, [initialPrompt, send, onInitialPromptConsumed]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span>Context:</span>
          <Badge variant="secondary" className="truncate">
            {context.label}
          </Badge>
          {status && (
            <Badge variant={status.live ? 'success' : 'outline'} title={status.live ? 'Connected to an OpenAI-compatible model' : 'No API key configured: using the deterministic demo model'}>
              {status.live ? status.model : 'demo model'}
            </Badge>
          )}
        </div>
        {chat.messages.length > 0 && (
          <Button size="xs" variant="ghost" onClick={chat.reset}>
            <Eraser /> Clear
          </Button>
        )}
      </div>
      {chat.messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">Ask about {context.type === 'workspace' ? 'your workspace' : context.label}</p>
            <p className="text-xs text-muted-foreground">Answers are grounded in live project data and cite their sources.</p>
          </div>
          <ul className="flex max-w-md flex-wrap justify-center gap-2">
            {SUGGESTIONS[context.type].map((s) => (
              <li key={s}>
                <Button size="xs" variant="outline" onClick={() => chat.send(s)} className="h-auto whitespace-normal py-1.5 text-left">
                  {s}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <MessageList messages={chat.messages} userName={user.name} onRetry={chat.retry} />
      )}
      <PromptInput onSubmit={chat.send} onStop={chat.stop} isStreaming={chat.isStreaming} autoFocus={autoFocus} />
    </div>
  );
}
