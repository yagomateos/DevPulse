'use client';

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { pickValid, useDataTableUrlState } from '@/components/data-table/use-data-table-url-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import { INCIDENT_STATUS, IncidentStatusBadge, SEVERITY, SeverityBadge } from '@/components/status/status-badges';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import { formatNumber } from '@/lib/format';
import { useDialogStore } from '@/stores/dialog-store';
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES, type IncidentSummary } from '@/types/domain';
import { useIncidentFacets, useIncidents } from '../hooks/use-incidents';

function columns(showProject: boolean): DataTableColumn<IncidentSummary>[] {
  return [
    { id: 'severity', accessorKey: 'severity', meta: { label: 'Severity' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Sev" />, cell: ({ row }) => <SeverityBadge severity={row.original.severity} />, size: 64 },
    {
      id: 'title',
      accessorKey: 'title',
      meta: { label: 'Incident' },
      enableHiding: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Incident" />,
      cell: ({ row }) => (
        <Link href={`/projects/${row.original.projectId}/incidents/${row.original.id}`} className="block max-w-[360px] hover:underline">
          <span className="block truncate font-medium">{row.original.title}</span>
          <span className="block font-mono text-[11px] text-muted-foreground">
            {row.original.reference}
            {showProject ? ` · ${row.original.projectId}` : ''}
          </span>
        </Link>
      ),
    },
    { id: 'status', accessorKey: 'status', meta: { label: 'Status' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => <IncidentStatusBadge status={row.original.status} /> },
    { id: 'service', accessorKey: 'service', meta: { label: 'Service' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Service" />, cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span> },
    {
      id: 'assignee',
      accessorKey: 'assignee',
      meta: { label: 'Assignee' },
      enableSorting: false,
      header: 'Assignee',
      cell: ({ row }) => (row.original.assignee ? <span className="flex items-center gap-2"><UserAvatar name={row.original.assignee} size="xs" />{row.original.assignee}</span> : <span className="text-muted-foreground">—</span>),
    },
    { id: 'affected', accessorKey: 'affectedUsers', meta: { label: 'Affected users' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Users" />, cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span> },
    { id: 'created', accessorKey: 'createdAt', meta: { label: 'Opened' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Opened" />, cell: ({ getValue }) => <RelativeTime value={getValue<string>()} className="text-xs text-muted-foreground" /> },
  ];
}

export function IncidentTable({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const openDialog = useDialogStore((s) => s.openDialog);
  const table = useDataTableUrlState({ filterKeys: ['severity', 'status', 'service', 'assignee'] as const, defaultSort: { id: 'created', desc: true } });
  const facets = useIncidentFacets(projectId);
  const query = useIncidents({
    ...table.query,
    severity: pickValid(table.filters.severity, INCIDENT_SEVERITIES),
    status: pickValid(table.filters.status, INCIDENT_STATUSES),
    service: table.filters.service,
    assignee: table.filters.assignee,
    projectId,
  });
  const cols = useMemo(() => columns(!projectId), [projectId]);
  const facetConfig = useMemo(
    () => [
      { key: 'severity', title: 'Severity', options: INCIDENT_SEVERITIES.map((s) => ({ label: SEVERITY[s].label, value: s })) },
      { key: 'status', title: 'Status', options: INCIDENT_STATUSES.map((s) => ({ label: INCIDENT_STATUS[s].label, value: s })) },
      { key: 'service', title: 'Service', options: (facets.data?.services ?? []).map((s) => ({ label: s, value: s })) },
      { key: 'assignee', title: 'Assignee', options: (facets.data?.assignees ?? []).map((a) => ({ label: a, value: a })) },
    ],
    [facets.data],
  );
  const declare = (
    <PermissionGate permission="incident:create">
      <Button size="sm" onClick={() => openDialog('create-incident', { projectId: projectId ?? null })}>
        <AlertTriangle /> Declare incident
      </Button>
    </PermissionGate>
  );

  return (
    <DataTable
      tableId="incidents"
      label="Incidents"
      columns={cols}
      data={query.data?.items}
      getRowId={(i) => i.id}
      state={table}
      onSortingChange={table.setSorting}
      onPaginationChange={table.setPagination}
      onSearchChange={table.setSearch}
      onFilterChange={(k, v) => table.setFilter(k as 'severity', v)}
      onReset={table.reset}
      manual={{ rowCount: query.data?.total ?? 0 }}
      facets={facetConfig}
      searchPlaceholder="Search incidents…"
      toolbarActions={declare}
      isLoading={query.isPending}
      isFetching={query.isFetching}
      error={query.isError && !query.data ? query.error : undefined}
      onRetry={() => query.refetch()}
      onRowActivate={(i) => router.push(`/projects/${i.projectId}/incidents/${i.id}`)}
      emptyState={<EmptyState icon={ShieldCheck} title="No incidents" description="Nothing has gone wrong here. Yet." action={declare} />}
      renderMobileCard={(i) => (
        <Link href={`/projects/${i.projectId}/incidents/${i.id}`} className="block space-y-1.5 rounded-lg border bg-card p-3">
          <span className="flex items-center gap-2">
            <SeverityBadge severity={i.severity} />
            <IncidentStatusBadge status={i.status} />
            <RelativeTime value={i.createdAt} className="ml-auto text-xs text-muted-foreground" />
          </span>
          <span className="block text-sm font-medium">{i.title}</span>
          <span className="block font-mono text-[11px] text-muted-foreground">
            {i.reference} · {i.service}
          </span>
        </Link>
      )}
    />
  );
}
