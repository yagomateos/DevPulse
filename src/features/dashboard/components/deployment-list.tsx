'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { QueryState } from '@/components/feedback/query-state';
import { RelativeTime } from '@/components/shared/relative-time';
import { DeploymentStatusBadge, EnvironmentBadge } from '@/components/status/status-badges';
import { useDeployments } from '@/features/deployments/hooks/use-deployments';
import type { Environment } from '@/types/domain';

export function DeploymentList({ projectId, environment, limit = 5 }: { projectId?: string; environment?: Environment; limit?: number }) {
  const query = useDeployments({ projectId, environment: environment ? [environment] : [], pageSize: limit });
  return (
    <QueryState query={query} loading={<LoadingSkeleton variant="list" rows={limit} />} empty={<EmptyState title="No deployments" compact />} isEmpty={(d) => d.items.length === 0} compactError>
      {(page) => (
        <ul className="divide-y">
          {page.items.map((d) => (
            <li key={d.id}>
              <Link href={`/projects/${d.projectId}/deployments/${d.number}`} className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-accent/50">
                <DeploymentStatusBadge status={d.status} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{d.commitMessage}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    #{d.number} · {d.projectId} · {d.commitSha}
                  </span>
                </span>
                <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  <EnvironmentBadge environment={d.environment} />
                  <RelativeTime value={d.startedAt} className="text-[11px] text-muted-foreground" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}
