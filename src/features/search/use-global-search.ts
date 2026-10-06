'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { miscQueries } from '@/services/misc';
import type { SearchResult, SearchResultType } from '@/types/domain';

export const SEARCH_GROUPS: { type: SearchResultType; label: string }[] = [
  { type: 'project', label: 'Projects' },
  { type: 'pull_request', label: 'Pull Requests' },
  { type: 'deployment', label: 'Deployments' },
  { type: 'incident', label: 'Incidents' },
  { type: 'member', label: 'Team' },
];

/**
 * Debounced server search. Abortable (TanStack passes an AbortSignal, so
 * stale requests are cancelled) and cached per term.
 */
export function useGlobalSearch(term: string) {
  const debounced = useDebouncedValue(term.trim(), 200);
  const query = useQuery(miscQueries.search(debounced));
  // Results for an older term must never be selectable (Enter would open a stale match).
  const isStale = term.trim() !== debounced;
  const groups = useMemo(() => {
    const results: SearchResult[] = query.data ?? [];
    return SEARCH_GROUPS.map((g) => ({ ...g, items: results.filter((r) => r.type === g.type) })).filter((g) => g.items.length > 0);
  }, [query.data]);

  return {
    term: debounced,
    groups: isStale ? [] : groups,
    total: isStale ? 0 : (query.data?.length ?? 0),
    // Typing ahead of the debounce counts as loading to avoid an "empty" flash.
    isLoading: term.trim().length > 0 && (query.isFetching || isStale),
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
