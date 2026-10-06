'use client';

import { AlertTriangle, Boxes, GitPullRequest, Rocket, User, type LucideIcon } from 'lucide-react';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { RetryButton } from '@/components/feedback/retry-button';
import type { SearchResultType } from '@/types/domain';
import { useGlobalSearch } from '../use-global-search';
import { Highlight } from './highlight';

const ICONS: Record<SearchResultType, LucideIcon> = { project: Boxes, pull_request: GitPullRequest, deployment: Rocket, incident: AlertTriangle, member: User };

interface GlobalSearchProps {
  term: string;
  onSelect: (href: string) => void;
}

/**
 * Grouped search results rendered inside a cmdk <Command>, which provides
 * arrow-key navigation, Enter to open and screen-reader semantics.
 */
export function GlobalSearch({ term, onSelect }: GlobalSearchProps) {
  const search = useGlobalSearch(term);
  if (!term.trim()) return null;

  if (search.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
        Search failed.
        <RetryButton onRetry={() => search.refetch()} />
      </div>
    );
  }
  if (search.isLoading && search.total === 0) {
    return (
      <div role="status" className="space-y-2 px-3 py-4" aria-label="Searching">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }
  if (search.total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No results for “<span className="text-foreground">{term}</span>”
      </p>
    );
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {search.total} results
      </p>
      {search.groups.map((group) => (
        <CommandGroup key={group.type} heading={group.label}>
          {group.items.map((item) => {
            const Icon = ICONS[item.type];
            return (
              <CommandItem key={`${item.type}-${item.id}`} value={`${item.type}-${item.id}`} onSelect={() => onSelect(item.href)}>
                <Icon className="mr-2 size-4 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  <Highlight text={item.title} query={search.term} />
                </span>
                <span className="ml-3 hidden max-w-[45%] truncate text-xs text-muted-foreground sm:inline">
                  <Highlight text={item.subtitle} query={search.term} />
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      ))}
    </>
  );
}
