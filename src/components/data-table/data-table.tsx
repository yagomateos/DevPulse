'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from '@tanstack/react-table';
import { SearchX } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BREAKPOINTS, useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { useTablePreferences } from '@/stores/table-preferences-store';
import type { FacetFilterConfig } from './faceted-filter';
import { DataTablePagination } from './pagination';
import { DataTableToolbar } from './toolbar';

// Columns of a table have heterogeneous value types; TanStack's own docs type
// mixed column arrays with `any` for the value parameter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumn<TData> = ColumnDef<TData, any>;

export interface DataTableState {
  sorting: SortingState;
  pagination: PaginationState;
  search: string;
  filters: Record<string, string[]>;
}

export interface DataTableProps<TData> {
  /** Stable id used to persist column visibility. */
  tableId: string;
  /** Accessible name of the table. */
  label: string;
  columns: DataTableColumn<TData>[];
  data: TData[] | undefined;
  getRowId: (row: TData) => string;

  state: DataTableState;
  onSortingChange: (sorting: SortingState) => void;
  onPaginationChange: (pagination: PaginationState) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (key: string, values: string[]) => void;
  onReset: () => void;

  /** Server-side mode: data is already filtered/sorted/paginated by the API. */
  manual?: { rowCount: number };

  facets?: FacetFilterConfig[];
  searchPlaceholder?: string;
  toolbarActions?: ReactNode;

  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyState?: ReactNode;

  /** Called on row click / Enter. */
  onRowActivate?: (row: TData) => void;
  /** Card layout below the md breakpoint. Falls back to a scrollable table. */
  renderMobileCard?: (row: TData) => ReactNode;

  enableSelection?: boolean;
  bulkActions?: (rows: TData[], clear: () => void) => ReactNode;
}

const inArray: FilterFn<unknown> = (row, columnId, value: string[]) => !value?.length || value.includes(String(row.getValue(columnId)));

function resolve<T>(updater: Updater<T>, current: T): T {
  return typeof updater === 'function' ? (updater as (old: T) => T)(current) : updater;
}

export function DataTable<TData>(props: DataTableProps<TData>) {
  const {
    tableId,
    label,
    columns,
    data,
    getRowId,
    state,
    manual,
    isLoading,
    isFetching,
    error,
    onRetry,
    emptyState,
    onRowActivate,
    renderMobileCard,
    enableSelection = false,
    bulkActions,
  } = props;

  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const storedVisibility = useTablePreferences((s) => s.visibility[tableId]);
  const setStoredVisibility = useTablePreferences((s) => s.setVisibility);
  const columnVisibility = useMemo<VisibilityState>(() => storedVisibility ?? {}, [storedVisibility]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columnFilters = useMemo<ColumnFiltersState>(
    () => Object.entries(state.filters).filter(([, v]) => v.length > 0).map(([id, value]) => ({ id, value })),
    [state.filters],
  );

  const allColumns = useMemo<DataTableColumn<TData>[]>(() => {
    if (!enableSelection) return columns;
    const select: DataTableColumn<TData> = {
      id: 'select',
      enableSorting: false,
      enableHiding: false,
      size: 32,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} onClick={(e) => e.stopPropagation()} aria-label="Select row" />
      ),
    };
    return [select, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data: data ?? [],
    columns: allColumns,
    getRowId,
    state: { sorting: state.sorting, pagination: state.pagination, globalFilter: state.search, columnFilters, columnVisibility, rowSelection },
    defaultColumn: { filterFn: inArray as FilterFn<TData> },
    onSortingChange: (u) => props.onSortingChange(resolve(u, state.sorting)),
    onPaginationChange: (u) => props.onPaginationChange(resolve(u, state.pagination)),
    onColumnVisibilityChange: (u) => setStoredVisibility(tableId, resolve(u, columnVisibility)),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableSelection,
    manualSorting: !!manual,
    manualFiltering: !!manual,
    manualPagination: !!manual,
    rowCount: manual?.rowCount,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    ...(manual ? {} : { getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel() }),
  });

  const rows = table.getRowModel().rows;
  const totalRows = manual ? manual.rowCount : table.getFilteredRowModel().rows.length;
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const clearSelection = useCallback(() => setRowSelection({}), []);
  const isFiltered = state.search.length > 0 || columnFilters.length > 0;

  /* ----------------------------- Keyboard nav ----------------------------- */
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const focusRow = (index: number) => {
    const target = bodyRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-row]')[index];
    if (target) {
      setActiveIndex(index);
      target.focus();
    }
  };
  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: Row<TData>, index: number) => {
    // Only handle keys when the row itself has focus (not a link/checkbox inside it).
    if (event.target !== event.currentTarget) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusRow(Math.min(rows.length - 1, index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusRow(Math.max(0, index - 1));
        break;
      case 'Home':
        event.preventDefault();
        focusRow(0);
        break;
      case 'End':
        event.preventDefault();
        focusRow(rows.length - 1);
        break;
      case 'Enter':
        if (onRowActivate) {
          event.preventDefault();
          onRowActivate(row.original);
        }
        break;
      case ' ':
        if (enableSelection) {
          event.preventDefault();
          row.toggleSelected();
        }
        break;
    }
  };

  const toolbar = (
    <DataTableToolbar
      table={table}
      search={state.search}
      onSearchChange={props.onSearchChange}
      searchPlaceholder={props.searchPlaceholder}
      facets={props.facets}
      filters={state.filters}
      onFilterChange={props.onFilterChange}
      isFiltered={isFiltered}
      onReset={props.onReset}
      actions={props.toolbarActions}
    />
  );

  const empty = isFiltered ? (
    <EmptyState
      icon={SearchX}
      title="No results match your filters"
      description="Try a different search term or clear the active filters."
      action={
        <Button variant="outline" size="sm" onClick={props.onReset}>
          Clear filters
        </Button>
      }
    />
  ) : (
    (emptyState ?? <EmptyState title="Nothing here yet" />)
  );

  let body: ReactNode;
  if (isLoading) body = <LoadingSkeleton variant={isMobile && renderMobileCard ? 'cards' : 'table'} rows={Math.min(state.pagination.pageSize, 8)} label={`Loading ${label}`} />;
  else if (error) body = <ErrorState error={error} onRetry={onRetry} />;
  else if (rows.length === 0) body = empty;
  else if (isMobile && renderMobileCard) {
    body = (
      <ul className="space-y-2" aria-label={label}>
        {rows.map((row) => (
          <li key={row.id}>{renderMobileCard(row.original)}</li>
        ))}
      </ul>
    );
  } else {
    body = (
      <div className="relative overflow-x-auto rounded-lg border scrollbar-thin">
        {isFetching && <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-primary/60" aria-hidden />}
        <table className="w-full caption-bottom text-sm" aria-label={label} aria-busy={isFetching || undefined} aria-rowcount={totalRows}>
          <thead className="bg-muted/30">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : header.column.getCanSort() ? 'none' : undefined}
                      className="h-9 whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-muted-foreground"
                      style={header.column.columnDef.size && header.column.columnDef.size < 100 ? { width: header.column.columnDef.size } : undefined}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody ref={bodyRef}>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                data-row
                data-state={row.getIsSelected() ? 'selected' : undefined}
                tabIndex={index === Math.min(activeIndex, rows.length - 1) ? 0 : -1}
                aria-selected={enableSelection ? row.getIsSelected() : undefined}
                onClick={(e) => {
                  setActiveIndex(index);
                  if (onRowActivate && !(e.target as HTMLElement).closest('a,button,[role="checkbox"],input')) onRowActivate(row.original);
                }}
                onKeyDown={(e) => onRowKeyDown(e, row, index)}
                className={cn(
                  'group border-b transition-colors last:border-0 hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-0 data-[state=selected]:bg-primary/5',
                  onRowActivate && 'cursor-pointer',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="h-11 whitespace-nowrap px-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {toolbar}
      {enableSelection && selectedRows.length > 0 && bulkActions && (
        <div role="region" aria-label="Bulk actions" className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm animate-fade-in">
          <span>
            <strong className="font-medium">{selectedRows.length}</strong> selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions(selectedRows, clearSelection)}
            <Button size="xs" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}
      {body}
      {!isLoading && !error && rows.length > 0 && <DataTablePagination table={table} totalRows={totalRows} />}
    </div>
  );
}
