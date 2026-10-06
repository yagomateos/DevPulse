'use client';

import type { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { DataTableFacetedFilter, type FacetFilterConfig } from './faceted-filter';
import { DataTableViewOptions } from './view-options';

interface ToolbarProps<TData> {
  table: Table<TData>;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  facets?: FacetFilterConfig[];
  filters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  isFiltered: boolean;
  onReset: () => void;
  actions?: ReactNode;
}

export function DataTableToolbar<TData>({ table, search, onSearchChange, searchPlaceholder = 'Search…', facets = [], filters, onFilterChange, isFiltered, onReset, actions }: ToolbarProps<TData>) {
  // Local input state keeps typing instant; the URL/API only sees debounced values.
  const [draft, setDraft] = useState(search);
  const debounced = useDebouncedValue(draft, 300);

  useEffect(() => {
    if (debounced !== search) onSearchChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced value
  }, [debounced]);

  // Reflect external resets (e.g. "Clear filters") in the input.
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    if (search !== debounced) setDraft(search);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            // Commit immediately when leaving the field (e.g. clicking a result) or on Enter,
            // so a pending debounce can never race a navigation.
            onBlur={() => draft !== search && onSearchChange(draft)}
            onKeyDown={(e) => e.key === 'Enter' && draft !== search && onSearchChange(draft)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder.replace('…', '')}
            className="h-8 pl-8 text-[13px]"
            type="search"
          />
        </div>
        {facets.map((facet) => (
          <DataTableFacetedFilter key={facet.key} title={facet.title} options={facet.options} selected={filters[facet.key] ?? []} onChange={(values) => onFilterChange(facet.key, values)} />
        ))}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft('');
              onReset();
            }}
            className="h-8 px-2"
          >
            Reset
            <X aria-hidden />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        {actions}
      </div>
    </div>
  );
}
