'use client';

import { Rocket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { pickValid, useDataTableUrlState } from '@/components/data-table/use-data-table-url-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import { DEPLOYMENT_STATUS, DeploymentStatusBadge, ENVIRONMENT, EnvironmentBadge } from '@/components/status/status-badges';
import { useUrlState } from '@/hooks/use-url-state';
import { formatDuration } from '@/lib/format';
import { DEPLOYMENT_STATUSES, ENVIRONMENTS, type DeploymentSummary } from '@/types/domain';
import { useDeployments } from '../hooks/use-deployments';
import { DeploymentPreviewDrawer } from './deployment-preview-drawer';

const FACETS = [
  { key: 'status', title: 'Status', options: DEPLOYMENT_STATUSES.map((s) => ({ label: DEPLOYMENT_STATUS[s].label, value: s, icon: DEPLOYMENT_STATUS[s].icon })) },
  { key: 'environment', title: 'Environment', options: ENVIRONMENTS.map((e) => ({ label: ENVIRONMENT[e].label, value: e })) },
];

function columns(showProject: boolean): DataTableColumn<DeploymentSummary>[] {
  return [
    { id: 'number', accessorKey: 'number', meta: { label: 'Deployment' }, header: ({ column }) => <DataTableColumnHeader column={column} title="#" />, cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.original.number}</span>, size: 56 },
    { id: 'status', accessorKey: 'status', meta: { label: 'Status' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => <DeploymentStatusBadge status={row.original.status} /> },
    {
      id: 'commit',
      accessorKey: 'commitMessage',
      meta: { label: 'Commit' },
      enableHiding: false,
      enableSorting: false,
      header: 'Commit',
      cell: ({ row }) => (
        <Link href={`/projects/${row.original.projectId}/deployments/${row.original.number}`} className="block max-w-[340px] hover:underline">
          <span className="block truncate">{row.original.commitMessage}</span>
          <span className="block truncate font-mono text-[11px] text-muted-foreground">
            {showProject ? `${row.original.projectId} · ` : ''}
            {row.original.commitSha} · {row.original.branch}
          </span>
        </Link>
      ),
    },
    { id: 'environment', accessorKey: 'environment', meta: { label: 'Environment' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Environment" />, cell: ({ row }) => <EnvironmentBadge environment={row.original.environment} /> },
    { id: 'author', accessorKey: 'author', meta: { label: 'Author' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Author" />, cell: ({ row }) => <span className="flex items-center gap-2"><UserAvatar name={row.original.author} size="xs" />{row.original.author}</span> },
    { id: 'duration', accessorKey: 'durationSeconds', meta: { label: 'Duration' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />, cell: ({ getValue }) => <span className="font-mono text-xs tabular-nums">{formatDuration(getValue<number>())}</span> },
    { id: 'tests', accessorFn: (r) => r.tests.failed, meta: { label: 'Tests' }, enableSorting: false, header: 'Tests', cell: ({ row }) => <span className={row.original.tests.failed ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{row.original.tests.failed ? `${row.original.tests.failed} failed` : `${row.original.tests.passed} passed`}</span> },
    { id: 'started', accessorKey: 'startedAt', meta: { label: 'Started' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Started" />, cell: ({ getValue }) => <RelativeTime value={getValue<string>()} className="text-xs text-muted-foreground" /> },
  ];
}

export function DeploymentTable({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const url = useUrlState();
  const table = useDataTableUrlState({ filterKeys: ['status', 'environment'] as const, defaultSort: { id: 'started', desc: true } });
  // A projectId in the URL (dashboard drill-down) scopes the global list.
  const scope = projectId ?? url.get('projectId') ?? undefined;
  const query = useDeployments({ ...table.query, status: pickValid(table.filters.status, DEPLOYMENT_STATUSES), environment: pickValid(table.filters.environment, ENVIRONMENTS), projectId: scope });
  const cols = useMemo(() => columns(!projectId), [projectId]);
  const preview = url.get('preview');
  const previewed = query.data?.items.find((d) => d.id === preview) ?? null;

  return (
    <>
      <DataTable
        tableId="deployments"
        label="Deployments"
        columns={cols}
        data={query.data?.items}
        getRowId={(d) => d.id}
        state={table}
        onSortingChange={table.setSorting}
        onPaginationChange={table.setPagination}
        onSearchChange={table.setSearch}
        onFilterChange={(k, v) => table.setFilter(k as 'status' | 'environment', v)}
        onReset={table.reset}
        manual={{ rowCount: query.data?.total ?? 0 }}
        facets={FACETS}
        searchPlaceholder="Search commit, SHA, author…"
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.isError && !query.data ? query.error : undefined}
        onRetry={() => query.refetch()}
        onRowActivate={(d) => url.set({ preview: d.id })}
        emptyState={<EmptyState icon={Rocket} title="No deployments yet" />}
        renderMobileCard={(d) => (
          <button type="button" onClick={() => url.set({ preview: d.id })} className="block w-full space-y-1.5 rounded-lg border bg-card p-3 text-left">
            <span className="flex items-center justify-between gap-2">
              <DeploymentStatusBadge status={d.status} />
              <RelativeTime value={d.startedAt} className="text-xs text-muted-foreground" />
            </span>
            <span className="block truncate text-sm">{d.commitMessage}</span>
            <span className="block font-mono text-[11px] text-muted-foreground">
              #{d.number} · {d.environment} · {d.author}
            </span>
          </button>
        )}
      />
      <DeploymentPreviewDrawer deployment={previewed} onClose={() => url.set({ preview: null })} onOpen={(d) => router.push(`/projects/${d.projectId}/deployments/${d.number}`)} />
    </>
  );
}
