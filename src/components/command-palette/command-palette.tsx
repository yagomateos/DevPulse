'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { GlobalSearch } from '@/features/search/components/global-search';
import { useCommandPalette, type PaletteCommand } from './use-command-palette';

const GROUP_ORDER: PaletteCommand['group'][] = ['Actions', 'Current project', 'Navigation', 'Preferences'];

function matches(command: PaletteCommand, term: string) {
  const haystack = [command.label, ...(command.keywords ?? [])].join(' ').toLowerCase();
  return term
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

/**
 * ⌘K palette: commands and live workspace search in one list. Filtering is
 * ours (shouldFilter=false) so server results and commands share keyboard
 * navigation without cmdk re-filtering async data.
 */
export function CommandPalette() {
  const router = useRouter();
  const { commands, open, mode, setOpen, hide } = useCommandPalette();
  const [term, setTerm] = useState('');

  const run = (fn: () => void) => {
    hide();
    setTerm('');
    fn();
  };
  const visible = term ? commands.filter((c) => matches(c, term)) : mode === 'search' ? [] : commands;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTerm('');
      }}
    >
      <DialogContent className="top-[15%] translate-y-0 overflow-hidden p-0 sm:max-w-xl [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">{mode === 'search' ? 'Search' : 'Command palette'}</DialogTitle>
        <DialogDescription className="sr-only">Type to search projects, pull requests, deployments, incidents and commands. Use arrow keys to navigate.</DialogDescription>
        <Command shouldFilter={false} loop className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-item]]:h-9 [&_[cmdk-item]]:rounded-md">
          <CommandInput value={term} onValueChange={setTerm} placeholder={mode === 'search' ? 'Search projects, PRs, deployments, incidents, people…' : 'Type a command or search…'} aria-label="Command or search" />
          <CommandList className="max-h-[min(60vh,420px)] scrollbar-thin">
            {term && <GlobalSearch term={term} onSelect={(href) => run(() => router.push(href))} />}
            {!term && mode === 'search' && <p className="py-8 text-center text-sm text-muted-foreground">Start typing to search the workspace.</p>}
            {term && visible.length > 0 && <CommandSeparator />}
            {GROUP_ORDER.map((group) => {
              const items = visible.filter((c) => c.group === group);
              if (!items.length) return null;
              return (
                <CommandGroup key={group} heading={group}>
                  {items.map((c) => (
                    <CommandItem key={c.id} value={`cmd-${c.id}`} onSelect={() => run(c.run)}>
                      <c.icon className="mr-2 size-4 text-muted-foreground" aria-hidden />
                      {c.label}
                      {c.shortcut && <CommandShortcut>{c.shortcut}</CommandShortcut>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
            {!term && mode === 'commands' && visible.length === 0 && <CommandEmpty>No commands available.</CommandEmpty>}
          </CommandList>
          <div className="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
