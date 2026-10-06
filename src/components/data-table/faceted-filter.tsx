'use client';

import { Check, PlusCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface FacetOption {
  label: string;
  value: string;
  icon?: LucideIcon;
  count?: number;
}

export interface FacetFilterConfig {
  key: string;
  title: string;
  options: FacetOption[];
}

interface Props {
  title: string;
  options: FacetOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

/** Multi-select filter in a popover (cmdk handles keyboard navigation + type-ahead). */
export function DataTableFacetedFilter({ title, options, selected, onChange }: Props) {
  const selectedSet = new Set(selected);
  const toggle = (value: string) => {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle aria-hidden />
          {title}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              <Badge variant="secondary" className="lg:hidden">
                {selected.length}
              </Badge>
              <span className="hidden gap-1 lg:flex">
                {selected.length > 2 ? (
                  <Badge variant="secondary">{selected.length} selected</Badge>
                ) : (
                  options
                    .filter((o) => selectedSet.has(o.value))
                    .map((o) => (
                      <Badge key={o.value} variant="secondary">
                        {o.label}
                      </Badge>
                    ))
                )}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command label={`Filter ${title}`}>
          <CommandInput placeholder={title} aria-label={`Filter ${title}`} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                const Icon = option.icon;
                return (
                  <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                    <span className={cn('flex size-4 items-center justify-center rounded-sm border border-primary', isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible')}>
                      <Check className="size-3" aria-hidden />
                    </span>
                    {Icon && <Icon className="size-3.5 text-muted-foreground" aria-hidden />}
                    <span className="flex-1">
                      {option.label}
                      {isSelected && <span className="sr-only"> (selected)</span>}
                    </span>
                    {option.count !== undefined && <span className="font-mono text-xs text-muted-foreground">{option.count}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onChange([])} className="justify-center text-center">
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
