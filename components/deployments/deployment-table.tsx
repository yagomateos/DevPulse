'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Deployment } from '@/types';
import { DataTable } from '@/components/data-table/data-table';
import { useDeployments } from '@/hooks/use-deployments';
import { ErrorState } from '@/components/shared/states';
import { DeploymentStatusBadge } from '@/components/shared/status-badges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRelativeTime, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

const envConfig: Record<string, string> = {
  production: 'border-success/30 bg-success/10 text-success',
  staging: 'border-warning/30 bg-warning/10 text-warning',
  preview: 'border-info/30 bg-info/10 text-info',
};

export function DeploymentTable({ projectId }: { projectId?: string }) {
  const { data, isLoading, isError, refetch } = useDeployments(projectId);
  const [statusFilter, setStatusFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((dep) => {
      if (statusFilter !== 'all' && dep.status !== statusFilter) return false;
      if (envFilter !== 'all' && dep.environment !== envFilter) return false;
      return true;
    });
  }, [data, statusFilter, envFilter]);

  const columns: ColumnDef<Deployment>[] = useMemo(
    () => [
      {
        accessorKey: 'commitSha',
        header: 'Commit',
        cell: ({ row }) => {
          const dep = row.original;
          const href = projectId
            ? `/projects/${projectId}/deployments/${dep.id}`
            : `/projects/${dep.projectId}/deployments/${dep.id}`;
          return (
            <Link href={href} className="font-mono text-sm text-primary hover:underline">
              {dep.commitSha}
            </Link>
          );
        },
      },
      {
        accessorKey: 'commitMessage',
        header: 'Message',
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate text-sm">
            {row.original.commitMessage}
          </span>
        ),
      },
      {
        accessorKey: 'environment',
        header: 'Environment',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn('capitalize font-medium', envConfig[row.original.environment])}
          >
            {row.original.environment}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <DeploymentStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'author',
        header: 'Author',
        cell: ({ row }) => {
          const dep = row.original;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={dep.authorAvatar} alt={dep.author} />
                <AvatarFallback>{dep.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm truncate max-w-[100px]">{dep.author}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'branch',
        header: 'Branch',
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {row.original.branch}
          </span>
        ),
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        cell: ({ row }) => {
          const dep = row.original;
          if (dep.status === 'in_progress') {
            return <span className="text-xs text-info animate-pulse">Running...</span>;
          }
          return (
            <span className="text-sm tabular-nums">{formatDuration(dep.duration)}</span>
          );
        },
      },
      {
        accessorKey: 'startTime',
        header: 'Started',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(row.original.startTime)}
          </span>
        ),
      },
    ],
    [projectId]
  );

  if (isError) {
    return <ErrorState title="Failed to load deployments" onRetry={refetch} />;
  }

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      isLoading={isLoading}
      searchKey="commitMessage"
      searchPlaceholder="Search deployments..."
      emptyMessage="No deployments found"
      toolbar={
        <>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={envFilter} onValueChange={setEnvFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Env" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All envs</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="preview">Preview</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
