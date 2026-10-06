'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import type { DataTableColumn } from '@/components/data-table/data-table';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import { PRStatusBadge, RiskBadge } from '@/components/status/status-badges';
import type { PullRequestSummary } from '@/types/domain';

export function getPullRequestColumns({ showProject }: { showProject: boolean }): DataTableColumn<PullRequestSummary>[] {
  return [
    {
      id: 'number',
      accessorKey: 'number',
      meta: { label: 'PR' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="PR" />,
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.original.number}</span>,
      size: 64,
    },
    {
      id: 'title',
      accessorKey: 'title',
      meta: { label: 'Title' },
      enableHiding: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <Link href={`/projects/${row.original.projectId}/pull-requests/${row.original.number}`} className="block max-w-[360px] hover:underline">
          <span className="block truncate font-medium">{row.original.title}</span>
          <span className="block truncate font-mono text-[11px] text-muted-foreground">
            {showProject ? `${row.original.projectId} · ` : ''}
            {row.original.branch}
          </span>
        </Link>
      ),
    },
    {
      id: 'author',
      accessorKey: 'author',
      meta: { label: 'Author' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Author" />,
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <UserAvatar name={row.original.author} size="xs" />
          {row.original.author}
        </span>
      ),
    },
    { id: 'status', accessorKey: 'status', meta: { label: 'Status' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => <PRStatusBadge status={row.original.status} /> },
    { id: 'files', accessorKey: 'filesChanged', meta: { label: 'Files' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Files" />, cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
    {
      id: 'changes',
      accessorFn: (r) => r.additions + r.deletions,
      meta: { label: 'Changes' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Changes" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs tabular-nums">
          <span className="text-success">+{row.original.additions}</span> <span className="text-destructive">−{row.original.deletions}</span>
        </span>
      ),
    },
    {
      id: 'tests',
      accessorFn: (r) => r.tests.failed,
      meta: { label: 'Tests' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tests" />,
      cell: ({ row }) => {
        const { passed, failed } = row.original.tests;
        return failed > 0 ? (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <XCircle className="size-3.5" aria-hidden /> {failed} failing
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-success" aria-hidden /> {passed}
          </span>
        );
      },
    },
    { id: 'risk', accessorKey: 'riskScore', meta: { label: 'Risk' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Risk" />, cell: ({ row }) => <RiskBadge level={row.original.riskLevel} score={row.original.riskScore} /> },
    { id: 'updated', accessorKey: 'updatedAt', meta: { label: 'Updated' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />, cell: ({ getValue }) => <RelativeTime value={getValue<string>()} className="text-xs text-muted-foreground" /> },
  ];
}
