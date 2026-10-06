'use client';

import Link from 'next/link';
import { GitPullRequest } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { QueryState } from '@/components/feedback/query-state';
import { RiskBadge } from '@/components/status/status-badges';
import { usePullRequests } from '../hooks/use-pull-requests';

export function RiskyPullRequests({ projectId, limit = 5 }: { projectId?: string; limit?: number }) {
  const query = usePullRequests({ projectId, status: ['open', 'draft'], sort: 'risk.desc', pageSize: limit });
  return (
    <QueryState query={query} loading={<LoadingSkeleton variant="list" rows={limit} />} empty={<EmptyState icon={GitPullRequest} title="No open pull requests" compact />} isEmpty={(d) => d.items.length === 0} compactError>
      {(page) => (
        <ul className="divide-y">
          {page.items.map((pr) => (
            <li key={pr.id}>
              <Link href={`/projects/${pr.projectId}/pull-requests/${pr.number}`} className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-accent/50">
                <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">#{pr.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{pr.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {pr.author} · +{pr.additions} −{pr.deletions}
                    {pr.tests.failed > 0 && <span className="text-destructive"> · {pr.tests.failed} failing tests</span>}
                  </span>
                </span>
                <RiskBadge level={pr.riskLevel} score={pr.riskScore} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}
