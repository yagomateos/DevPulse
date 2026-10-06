'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorState } from './error-state';

interface QueryStateProps<T> {
  query: Pick<UseQueryResult<T>, 'data' | 'error' | 'isPending' | 'isError' | 'refetch' | 'isRefetching'>;
  loading: ReactNode;
  /** Rendered when `isEmpty(data)` is true. */
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  errorTitle?: string;
  compactError?: boolean;
  children: (data: T) => ReactNode;
}

/**
 * Declarative loading → error → empty → success switch for a TanStack query,
 * so every data-driven surface handles all four states the same way.
 */
export function QueryState<T>({ query, loading, empty, isEmpty, errorTitle, compactError, children }: QueryStateProps<T>) {
  if (query.isPending) return <>{loading}</>;
  if (query.isError) {
    return <ErrorState error={query.error} title={errorTitle} onRetry={() => query.refetch()} isRetrying={query.isRefetching} compact={compactError} />;
  }
  const data = query.data as T;
  if (empty && isEmpty?.(data)) return <>{empty}</>;
  return <>{children(data)}</>;
}
