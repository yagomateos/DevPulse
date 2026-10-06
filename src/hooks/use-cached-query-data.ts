'use client';

import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Reads a query's data from the cache *without* creating the query.
 *
 * Components rendered before a page's <HydrationBoundary> (top bar, sidebar)
 * must not create pending queries: TanStack then treats the hydrated data as
 * an update to an existing query and defers it to an effect, which never runs
 * during SSR — so the page would server-render without its data.
 */
export function useCachedQueryData<T>(queryKey: QueryKey, enabled = true): T | undefined {
  const client = useQueryClient();
  const subscribe = useCallback((onChange: () => void) => client.getQueryCache().subscribe(onChange), [client]);
  return useSyncExternalStore(
    subscribe,
    () => (enabled ? client.getQueryData<T>(queryKey) : undefined),
    () => undefined,
  );
}
