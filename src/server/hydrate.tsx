import 'server-only';
import { dehydrate, HydrationBoundary, type QueryKey } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { makeQueryClient } from '@/lib/query-client';

interface HydrateProps {
  /** [queryKey, data] pairs fetched on the server via the repository. */
  queries: ReadonlyArray<readonly [QueryKey, unknown]>;
  children: ReactNode;
}

/**
 * Seeds the client's TanStack cache with data loaded in a Server Component.
 * The client hooks use the same query keys, so they render instantly from
 * cache and keep full client-side behaviour (refetch, mutations, invalidation).
 */
export function Hydrate({ queries, children }: HydrateProps) {
  const client = makeQueryClient();
  for (const [key, data] of queries) client.setQueryData(key, data);
  return <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>;
}
