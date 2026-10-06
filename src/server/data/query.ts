import type { Paginated } from '@/types/domain';

/** Generic, typed helpers used by the in-memory repository to emulate SQL. */

export function matchesText(query: string | undefined, ...fields: (string | number | null | undefined)[]) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((f) => f != null && String(f).toLowerCase().includes(needle));
}

export function inSet<T extends string>(values: readonly T[], value: T) {
  return values.length === 0 || values.includes(value);
}

type Comparable = string | number | null | undefined;

export function sortBy<T>(items: T[], sort: string | undefined, accessors: Record<string, (item: T) => Comparable>, fallback: string) {
  const [field, direction] = (sort ?? fallback).split('.') as [string, 'asc' | 'desc'];
  const accessor = accessors[field] ?? accessors[fallback.split('.')[0]!];
  if (!accessor) return items;
  const factor = direction === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
    return String(av).localeCompare(String(bv)) * factor;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: safePage, pageSize, pageCount };
}
