'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export type UrlPatch = Record<string, string | number | string[] | null | undefined>;

/**
 * URL search params as state. Updates use the native History API, which
 * Next.js App Router syncs with `useSearchParams` *without* a server round
 * trip — filters stay shareable/bookmarkable but feel instant.
 */
export function useUrlState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const get = useCallback((key: string) => searchParams.get(key), [searchParams]);
  const getList = useCallback((key: string) => searchParams.get(key)?.split(',').filter(Boolean) ?? [], [searchParams]);

  const set = useCallback(
    (patch: UrlPatch, { history = 'replace' }: { history?: 'push' | 'replace' } = {}) => {
      // A deferred update (e.g. debounced search) must not undo a navigation already in flight.
      if (window.location.pathname !== pathname) return;
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        const serialised = Array.isArray(value) ? value.join(',') : value == null ? '' : String(value);
        if (serialised === '') params.delete(key);
        else params.set(key, serialised);
      }
      const qs = params.toString();
      const url = `${pathname}${qs ? `?${qs}` : ''}`;
      if (history === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    },
    [pathname],
  );

  return { searchParams, get, getList, set };
}
