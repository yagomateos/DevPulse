'use client';

import { AlertCircle, Copy, RotateCw, Sparkles, Square } from 'lucide-react';
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';
import type { ChatMessage as Message } from '../hooks/use-chat';
import { SourceReference } from './source-reference';

const AIResponse = dynamic(() => import('./ai-response'), {
  loading: () => <Skeleton className="h-4 w-3/4" />,
});

interface ChatMessageProps {
  message: Message;
  userName: string;
  isLast: boolean;
  onRetry: () => void;
}

/** Memoised: while streaming, only the last message re-renders per token. */
export const ChatMessage = memo(function ChatMessage({ message, userName, isLast, onRetry }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <li className="flex justify-end gap-2.5">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-tr-sm bg-primary/10 px-3 py-2 text-sm">{message.content}</div>
        <UserAvatar name={userName} size="sm" className="mt-0.5" />
      </li>
    );
  }

  const streaming = message.status === 'streaming';
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary" aria-hidden>
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {message.statusText && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
            {message.statusText}
          </p>
        )}
        {message.content && <AIResponse content={message.content} streaming={streaming} />}
        {message.sources.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, i) => (
                <SourceReference key={s.href} source={s} index={i} />
              ))}
            </div>
          </div>
        )}
        {message.status === 'error' && (
          <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            <span className="flex-1">{message.error ?? 'Something went wrong.'}</span>
            {isLast && (
              <Button size="xs" variant="outline" onClick={onRetry}>
                <RotateCw /> Retry
              </Button>
            )}
          </div>
        )}
        {message.status === 'stopped' && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Square className="size-3" aria-hidden /> Stopped
            {isLast && (
              <Button size="xs" variant="ghost" onClick={onRetry}>
                <RotateCw /> Regenerate
              </Button>
            )}
          </p>
        )}
        {message.status === 'done' && (
          <div className={cn('flex items-center gap-1 text-[11px] text-muted-foreground')}>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(message.content);
                toast.success('Copied to clipboard');
              }}
              aria-label="Copy answer"
            >
              <Copy />
            </Button>
            {isLast && (
              <Button size="xs" variant="ghost" onClick={onRetry} aria-label="Regenerate answer">
                <RotateCw />
              </Button>
            )}
            {message.model && <span className="ml-1 font-mono">{message.model}</span>}
          </div>
        )}
      </div>
    </li>
  );
});
