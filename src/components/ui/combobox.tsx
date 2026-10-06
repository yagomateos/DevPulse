'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Extra text that is searchable but not shown as the main label. */
  keywords?: string[];
  description?: string;
  icon?: ReactNode;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Adds a "none" option that clears the value. */
  clearLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Searchable select (WAI-ARIA combobox pattern): a button trigger exposing
 * aria-expanded/aria-controls, a filterable listbox with arrow-key
 * navigation (cmdk), Enter to choose and Escape to close with focus restored.
 * Composable with React Hook Form via value/onChange like a native control.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  clearLabel,
  disabled,
  id,
  className,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const selected = options.find((o) => o.value === value);
  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn('w-full justify-between px-3 font-normal aria-[invalid=true]:border-destructive', !selected && 'text-muted-foreground', className)}
          {...aria}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {selected?.icon}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronsUpDown className="opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-56 p-0" align="start">
        <Command label={searchPlaceholder.replace('…', '')}>
          <CommandInput placeholder={searchPlaceholder} aria-label={searchPlaceholder.replace('…', '')} />
          <CommandList id={listId} className="max-h-64 scrollbar-thin">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {clearLabel && (
                <CommandItem value={`__clear__ ${clearLabel}`} onSelect={() => choose(null)}>
                  <Check className={cn('mr-2 size-4', value === null ? 'opacity-100' : 'opacity-0')} aria-hidden />
                  <span className="text-muted-foreground">{clearLabel}</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem key={option.value} value={[option.label, option.value, ...(option.keywords ?? [])].join(' ')} onSelect={() => choose(option.value)}>
                  <Check className={cn('mr-2 size-4 shrink-0', option.value === value ? 'opacity-100' : 'opacity-0')} aria-hidden />
                  {option.icon}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.description && <span className="ml-2 truncate text-xs text-muted-foreground">{option.description}</span>}
                  {option.value === value && <span className="sr-only"> (selected)</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
