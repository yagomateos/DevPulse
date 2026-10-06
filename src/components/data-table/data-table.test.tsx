import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../tests/setup/render';
import { DataTableColumnHeader } from './column-header';
import { DataTable, type DataTableColumn, type DataTableState } from './data-table';

interface Row {
  id: string;
  name: string;
  status: 'open' | 'closed';
  score: number;
}

const ROWS: Row[] = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, name: `Item ${String.fromCharCode(65 + i)}`, status: i % 3 === 0 ? 'closed' : 'open', score: (i * 7) % 10 }));

const columns: DataTableColumn<Row>[] = [
  { accessorKey: 'name', meta: { label: 'Name' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
  { accessorKey: 'status', meta: { label: 'Status' }, header: 'Status' },
  { accessorKey: 'score', meta: { label: 'Score' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Score" /> },
];

function Harness({ onActivate = vi.fn(), data = ROWS, ...rest }: { onActivate?: (r: Row) => void; data?: Row[]; isLoading?: boolean; error?: unknown; onRetry?: () => void }) {
  const [state, setState] = useState<DataTableState>({ sorting: [], pagination: { pageIndex: 0, pageSize: 5 }, search: '', filters: {} });
  return (
    <DataTable
      tableId="test"
      label="Items"
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      state={state}
      onSortingChange={(sorting) => setState((s) => ({ ...s, sorting }))}
      onPaginationChange={(pagination) => setState((s) => ({ ...s, pagination }))}
      onSearchChange={(search) => setState((s) => ({ ...s, search, pagination: { ...s.pagination, pageIndex: 0 } }))}
      onFilterChange={(key, values) => setState((s) => ({ ...s, filters: { ...s.filters, [key]: values } }))}
      onReset={() => setState((s) => ({ ...s, search: '', filters: {} }))}
      facets={[{ key: 'status', title: 'Status', options: [{ label: 'Open', value: 'open' }, { label: 'Closed', value: 'closed' }] }]}
      onRowActivate={onActivate}
      enableSelection
      bulkActions={(rows) => <span>bulk:{rows.length}</span>}
      {...rest}
    />
  );
}

const bodyRows = () => within(screen.getByRole('table', { name: 'Items' })).getAllByRole('row').slice(1);
const names = () => bodyRows().map((r) => within(r).getAllByRole('cell')[1]!.textContent);

describe('DataTable', () => {
  it('paginates and reports the visible range', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByText('1–5 of 12')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('6–10 of 12')).toBeInTheDocument();
    expect(names()[0]).toBe('Item F');
  });

  it('sorts via accessible header buttons and exposes aria-sort', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    await user.click(screen.getByRole('button', { name: /sort by name/i }));
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'ascending');
    await user.click(screen.getByRole('button', { name: /sort by name/i }));
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'descending');
    expect(names()[0]).toBe('Item L');
  });

  it('filters with debounced search and shows a resettable empty state', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<Harness />);
    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'zzz');
    await act(() => vi.advanceTimersByTimeAsync(350));
    expect(screen.getByText('No results match your filters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(bodyRows()).toHaveLength(5);
    vi.useRealTimers();
  });

  it('applies faceted filters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    await user.click(screen.getByRole('button', { name: /status/i }));
    await user.click(await screen.findByRole('option', { name: /closed/i }));
    await user.keyboard('{Escape}');
    expect(screen.getByText('1–4 of 4')).toBeInTheDocument();
  });

  it('toggles column visibility from the view menu', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    expect(screen.getByRole('columnheader', { name: /score/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View' }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Score' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('columnheader', { name: /score/i })).not.toBeInTheDocument();
  });

  it('supports keyboard navigation, Enter to open and Space to select', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    renderWithProviders(<Harness onActivate={onActivate} />);
    bodyRows()[0]!.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(bodyRows()[2]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Item C' }));
    await user.keyboard(' ');
    expect(screen.getByRole('region', { name: 'Bulk actions' })).toHaveTextContent('bulk:1');
  });

  it('renders loading and error states with retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = renderWithProviders(<Harness isLoading />);
    expect(screen.getByRole('status', { name: /loading items/i })).toBeInTheDocument();
    rerender(<Harness error={new Error('Boom')} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
