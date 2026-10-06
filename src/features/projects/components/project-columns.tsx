'use client';

import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import type { DataTableColumn } from '@/components/data-table/data-table';
import { HealthScore } from '@/components/shared/health-score';
import { RelativeTime } from '@/components/shared/relative-time';
import { DeploymentStatusBadge, ProjectStatusBadge } from '@/components/status/status-badges';
import type { Project } from '@/types/domain';

export const projectColumns: DataTableColumn<Project>[] = [
  {
    accessorKey: 'name',
    meta: { label: 'Name' },
    enableHiding: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link href={`/projects/${row.original.id}`} className="block max-w-[260px] hover:underline">
        <span className="block truncate font-medium">{row.original.name}</span>
        <span className="block truncate font-mono text-xs text-muted-foreground">{row.original.repository}</span>
      </Link>
    ),
  },
  { accessorKey: 'status', meta: { label: 'Status' }, header: 'Status', enableSorting: false, cell: ({ row }) => <ProjectStatusBadge status={row.original.status} /> },
  { accessorKey: 'deploymentStatus', meta: { label: 'Deployment' }, header: 'Deployment', enableSorting: false, cell: ({ row }) => <DeploymentStatusBadge status={row.original.deploymentStatus} /> },
  { accessorKey: 'openPullRequests', meta: { label: 'Open PRs' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Open PRs" />, cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
  {
    accessorKey: 'activeIncidents',
    meta: { label: 'Incidents' },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Incidents" />,
    cell: ({ getValue }) => <span className={getValue<number>() > 0 ? 'font-medium text-destructive tabular-nums' : 'tabular-nums text-muted-foreground'}>{getValue<number>()}</span>,
  },
  { accessorKey: 'healthScore', meta: { label: 'Health' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Health" />, cell: ({ getValue }) => <HealthScore score={getValue<number>()} size={24} /> },
  { accessorKey: 'lastDeploymentAt', meta: { label: 'Last deploy' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Last deploy" />, cell: ({ getValue }) => <RelativeTime value={getValue<string | null>()} className="text-muted-foreground" /> },
  { accessorKey: 'language', meta: { label: 'Language' }, header: 'Language', enableSorting: false, cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span> },
];
