'use client';

import { GitPullRequest } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { pickValid, useDataTableUrlState } from '@/components/data-table/use-data-table-url-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { PR_STATUS, PRStatusBadge, RISK, RiskBadge } from '@/components/status/status-badges';
import { PR_STATUSES, RISK_LEVELS } from '@/types/domain';
import { usePullRequests } from '../hooks/use-pull-requests';
import { getPullRequestColumns } from './pull-request-columns';

const FACETS = [
  { key: 'status', title: 'Status', options: PR_STATUSES.map((s) => ({ label: PR_STATUS[s].label, value: s, icon: PR_STATUS[s].icon })) },
  { key: 'risk', title: 'Risk', options: RISK_LEVELS.map((r) => ({ label: RISK[r].label, value: r })) },
];

/** Server-driven table: every interaction becomes a URL change → typed API query. */
export function PullRequestTable({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const table = useDataTableUrlState({ filterKeys: ['status', 'risk'] as const, defaultSort: { id: 'updated', desc: true } });
  const query = usePullRequests({ ...table.query, status: pickValid(table.filters.status, PR_STATUSES), risk: pickValid(table.filters.risk, RISK_LEVELS), projectId });
  const columns = useMemo(() => getPullRequestColumns({ showProject: !projectId }), [projectId]);

  return (
    <DataTable
      tableId="pull-requests"
      label="Pull requests"
      columns={columns}
      data={query.data?.items}
      getRowId={(pr) => pr.id}
      state={table}
      onSortingChange={table.setSorting}
      onPaginationChange={table.setPagination}
      onSearchChange={table.setSearch}
      onFilterChange={(k, v) => table.setFilter(k as 'status' | 'risk', v)}
      onReset={table.reset}
      manual={{ rowCount: query.data?.total ?? 0 }}
      facets={FACETS}
      searchPlaceholder="Search title, author, #number…"
      isLoading={query.isPending}
      isFetching={query.isFetching}
      error={query.isError && !query.data ? query.error : undefined}
      onRetry={() => query.refetch()}
      onRowActivate={(pr) => router.push(`/projects/${pr.projectId}/pull-requests/${pr.number}`)}
      emptyState={<EmptyState icon={GitPullRequest} title="No pull requests" description="Pull requests opened against this repository will appear here." />}
      renderMobileCard={(pr) => (
        <Link href={`/projects/${pr.projectId}/pull-requests/${pr.number}`} className="block space-y-2 rounded-lg border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium">{pr.title}</span>
            <RiskBadge level={pr.riskLevel} score={pr.riskScore} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <PRStatusBadge status={pr.status} />
            <span className="font-mono">#{pr.number}</span>
            <span>{pr.author}</span>
            <span className="font-mono">
              <span className="text-success">+{pr.additions}</span> <span className="text-destructive">−{pr.deletions}</span>
            </span>
          </div>
        </Link>
      )}
    />
  );
}
