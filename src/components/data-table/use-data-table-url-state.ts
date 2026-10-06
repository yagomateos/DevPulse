'use client';

import type { PaginationState, SortingState } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { useUrlState } from '@/hooks/use-url-state';

interface Options<F extends string> {
  /** Facet filter keys stored as comma separated lists, e.g. ['status', 'risk']. */
  filterKeys: readonly F[];
  defaultSort?: { id: string; desc: boolean };
  defaultPageSize?: number;
  /** Prefix when several tables share a page. */
  prefix?: string;
}

/**
 * Table state (search, facets, sorting, pagination) stored in the URL.
 * The returned `query` object maps 1:1 to the API's list query schema.
 */
export function useDataTableUrlState<F extends string>({ filterKeys, defaultSort, defaultPageSize = 10, prefix = '' }: Options<F>) {
  const url = useUrlState();
  const k = useCallback((key: string) => `${prefix}${key}`, [prefix]);

  const search = url.get(k('q')) ?? '';
  const page = Math.max(1, Number(url.get(k('page')) ?? 1) || 1);
  const pageSize = Number(url.get(k('size')) ?? defaultPageSize) || defaultPageSize;
  const sortParam = url.get(k('sort'));

  const sorting: SortingState = useMemo(() => {
    if (sortParam) {
      const [id, dir] = sortParam.split('.');
      if (id) return [{ id, desc: dir === 'desc' }];
    }
    return defaultSort ? [defaultSort] : [];
  }, [sortParam, defaultSort]);

  const filtersKey = filterKeys.map((f) => url.get(k(f)) ?? '').join('|');
  const filters = useMemo(
    () => Object.fromEntries(filterKeys.map((f) => [f, url.getList(k(f))])) as Record<F, string[]>,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filtersKey captures the relevant params
    [filtersKey],
  );

  const pagination: PaginationState = useMemo(() => ({ pageIndex: page - 1, pageSize }), [page, pageSize]);

  const setSearch = useCallback((value: string) => url.set({ [k('q')]: value || null, [k('page')]: null }), [url, k]);
  const setFilter = useCallback((key: F, values: string[]) => url.set({ [k(key)]: values, [k('page')]: null }), [url, k]);
  const setSorting = useCallback(
    (next: SortingState) => {
      const first = next[0];
      url.set({ [k('sort')]: first ? `${first.id}.${first.desc ? 'desc' : 'asc'}` : null, [k('page')]: null });
    },
    [url, k],
  );
  const setPagination = useCallback(
    (next: PaginationState) => url.set({ [k('page')]: next.pageIndex > 0 ? next.pageIndex + 1 : null, [k('size')]: next.pageSize !== defaultPageSize ? next.pageSize : null }),
    [url, k, defaultPageSize],
  );
  const reset = useCallback(() => url.set(Object.fromEntries([...filterKeys, 'q', 'page', 'sort'].map((f) => [k(f), null]))), [url, k, filterKeys]);

  const isFiltered = search.length > 0 || Object.values<string[]>(filters).some((v) => v.length > 0);
  const sort = sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? 'desc' : 'asc'}` : undefined;

  return {
    search,
    filters,
    sorting,
    pagination,
    isFiltered,
    setSearch,
    setFilter,
    setSorting,
    setPagination,
    reset,
    /** Ready to pass to the list API. */
    query: { q: search || undefined, sort, page, pageSize, ...filters },
  };
}

export type DataTableUrlState<F extends string> = ReturnType<typeof useDataTableUrlState<F>>;

/** URL values are untrusted input: keep only members of the allowed set (typed). */
export function pickValid<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return values.filter((v): v is T => (allowed as readonly string[]).includes(v));
}
