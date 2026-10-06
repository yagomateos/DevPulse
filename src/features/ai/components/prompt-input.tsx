'use client';

import { ArrowUp, Square } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';

interface PromptInputProps {
  onSubmit: (value: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Enter to send, Shift+Enter for a new line; auto-growing textarea. */
export function PromptInput({ onSubmit, onStop, isStreaming, placeholder = 'Ask about projects, PRs, deployments or incidents…', autoFocus }: PromptInputProps) {
  const [value, setValue] = useState('');
  const submit = () => {
    if (!value.trim() || isStreaming) return;
    onSubmit(value);
    setValue('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t p-3"
    >
      <div className="flex items-end gap-2 rounded-lg border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
        <label htmlFor="ai-prompt" className="sr-only">
          Message the AI assistant
        </label>
        <textarea
          id="ai-prompt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          autoFocus={autoFocus}
          maxLength={4000}
          className="max-h-40 min-h-6 flex-1 resize-none bg-transparent text-sm outline-none [field-sizing:content] placeholder:text-muted-foreground"
        />
        {isStreaming ? (
          <Button type="button" size="icon-sm" variant="secondary" onClick={onStop} aria-label="Stop generating">
            <Square className="fill-current" />
          </Button>
        ) : (
          <Button type="submit" size="icon-sm" disabled={!value.trim()} aria-label="Send message">
            <ArrowUp />
          </Button>
        )}
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
    </form>
  );
}
