'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Incident } from '@/types';
import { DataTable } from '@/components/data-table/data-table';
import { useIncidents } from '@/hooks/use-incidents';
import { ErrorState } from '@/components/shared/states';
import {
  IncidentStatusBadge,
  SeverityBadge,
} from '@/components/shared/status-badges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRelativeTime, formatDuration } from '@/lib/format';

export function IncidentTable({ projectId }: { projectId?: string }) {
  const { data, isLoading, isError, refetch } = useIncidents(projectId);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((inc) => {
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
      return true;
    });
  }, [data, severityFilter, statusFilter]);

  const columns: ColumnDef<Incident>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Incident',
        cell: ({ row }) => {
          const inc = row.original;
          const href = projectId
            ? `/projects/${projectId}/incidents/${inc.id}`
            : `/projects/${inc.projectId}/incidents/${inc.id}`;
          return (
            <Link href={href} className="block max-w-[280px]">
              <p className="truncate text-sm font-medium hover:text-primary transition-colors">
                {inc.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {inc.service}
              </p>
            </Link>
          );
        },
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <IncidentStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'service',
        header: 'Service',
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {row.original.service}
          </span>
        ),
      },
      {
        accessorKey: 'assignee',
        header: 'Assignee',
        cell: ({ row }) => {
          const inc = row.original;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={inc.assigneeAvatar} alt={inc.assignee} />
                <AvatarFallback>{inc.assignee.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm truncate max-w-[100px]">{inc.assignee}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'affectedUsers',
        header: 'Affected',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.affectedUsers.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatDuration(row.original.duration)}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [projectId]
  );

  if (isError) {
    return <ErrorState title="Failed to load incidents" onRetry={refetch} />;
  }

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      isLoading={isLoading}
      searchKey="title"
      searchPlaceholder="Search incidents..."
      emptyMessage="No incidents found"
      toolbar={
        <>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severity</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="identified">Identified</SelectItem>
              <SelectItem value="monitoring">Monitoring</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
