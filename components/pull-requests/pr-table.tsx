'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PullRequest } from '@/types';
import { DataTable } from '@/components/data-table/data-table';
import { usePullRequests } from '@/hooks/use-pull-requests';
import { ErrorState } from '@/components/shared/states';
import {
  PRStatusBadge,
  RiskBadge,
  RiskScoreBar,
} from '@/components/shared/status-badges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function PRTable({ projectId }: { projectId?: string }) {
  const { data, isLoading, isError, refetch } = usePullRequests(projectId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((pr) => {
      if (statusFilter !== 'all' && pr.status !== statusFilter) return false;
      if (riskFilter !== 'all' && pr.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [data, statusFilter, riskFilter]);

  const columns: ColumnDef<PullRequest>[] = useMemo(
    () => [
      {
        accessorKey: 'number',
        header: 'PR',
        cell: ({ row }) => {
          const pr = row.original;
          const href = projectId
            ? `/projects/${projectId}/pull-requests/${pr.id}`
            : `/projects/${pr.projectId}/pull-requests/${pr.id}`;
          return (
            <Link href={href} className="font-mono text-sm text-primary hover:underline">
              #{pr.number}
            </Link>
          );
        },
        size: 60,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => {
          const pr = row.original;
          const href = projectId
            ? `/projects/${projectId}/pull-requests/${pr.id}`
            : `/projects/${pr.projectId}/pull-requests/${pr.id}`;
          return (
            <Link href={href} className="block max-w-[280px]">
              <p className="truncate text-sm font-medium hover:text-primary transition-colors">
                {pr.title}
              </p>
              <div className="flex gap-1 mt-1">
                {pr.labels.slice(0, 2).map((label) => (
                  <Badge key={label} variant="secondary" className="text-[10px] py-0 px-1.5">
                    {label}
                  </Badge>
                ))}
              </div>
            </Link>
          );
        },
      },
      {
        accessorKey: 'author',
        header: 'Author',
        cell: ({ row }) => {
          const pr = row.original;
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={pr.authorAvatar} alt={pr.author} />
                <AvatarFallback>{pr.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm truncate max-w-[100px]">{pr.author}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <PRStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'filesChanged',
        header: 'Files',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{row.original.filesChanged}</span>
        ),
      },
      {
        id: 'changes',
        header: 'Changes',
        cell: ({ row }) => {
          const pr = row.original;
          return (
            <span className="text-xs font-mono">
              <span className="text-success">+{pr.additions}</span>{' '}
              <span className="text-destructive">-{pr.deletions}</span>
            </span>
          );
        },
      },
      {
        id: 'tests',
        header: 'Tests',
        cell: ({ row }) => {
          const pr = row.original;
          const allPassed = pr.testsFailed === 0;
          return (
            <span
              className={cn(
                'text-xs tabular-nums',
                allPassed ? 'text-success' : 'text-destructive'
              )}
            >
              {pr.testsPassed}/{pr.testsTotal}
            </span>
          );
        },
      },
      {
        accessorKey: 'riskLevel',
        header: 'Risk',
        cell: ({ row }) => <RiskBadge level={row.original.riskLevel} />,
      },
      {
        accessorKey: 'riskScore',
        header: 'Score',
        cell: ({ row }) => <RiskScoreBar score={row.original.riskScore} />,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(row.original.updatedAt)}
          </span>
        ),
      },
    ],
    [projectId]
  );

  if (isError) {
    return (
      <ErrorState
        title="Failed to load pull requests"
        onRetry={refetch}
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      isLoading={isLoading}
      searchKey="title"
      searchPlaceholder="Search pull requests..."
      emptyMessage="No pull requests found"
      emptyDescription="No PRs match your current filters."
      toolbar={
        <>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
