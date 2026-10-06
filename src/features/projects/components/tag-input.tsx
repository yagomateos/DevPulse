'use client';

import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  id?: string;
  invalid?: boolean;
  'aria-describedby'?: string;
}

/** Controlled tag editor: Enter/comma adds, Backspace removes the last tag. */
export function TagInput({ value, onChange, max = 6, id, invalid, ...aria }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const tag = draft.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !value.includes(tag) && value.length < max) onChange([...value, tag]);
    setDraft('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className={cn('flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring', invalid && 'border-destructive')}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`} className="rounded text-muted-foreground hover:text-foreground">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        disabled={value.length >= max}
        placeholder={value.length >= max ? `Max ${max} tags` : 'Add tag…'}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        aria-invalid={invalid}
        {...aria}
      />
    </div>
  );
}
