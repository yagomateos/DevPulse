'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { QueryState } from '@/components/feedback/query-state';
import { RelativeTime } from '@/components/shared/relative-time';
import { IncidentStatusBadge, SeverityBadge } from '@/components/status/status-badges';
import { useIncidents } from '@/features/incidents/hooks/use-incidents';
import { formatNumber } from '@/lib/format';

export function IncidentList({ projectId, limit = 5 }: { projectId?: string; limit?: number }) {
  const query = useIncidents({ projectId, status: ['investigating', 'identified', 'monitoring'], sort: 'severity.asc', pageSize: limit });
  return (
    <QueryState
      query={query}
      loading={<LoadingSkeleton variant="list" rows={3} />}
      empty={<EmptyState icon={ShieldCheck} title="No active incidents" description="All systems operational." compact />}
      isEmpty={(d) => d.items.length === 0}
      compactError
    >
      {(page) => (
        <ul className="divide-y">
          {page.items.map((i) => (
            <li key={i.id}>
              <Link href={`/projects/${i.projectId}/incidents/${i.id}`} className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-accent/50">
                <SeverityBadge severity={i.severity} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{i.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {i.reference} · {i.service} · {formatNumber(i.affectedUsers)} users · <RelativeTime value={i.createdAt} />
                  </span>
                </span>
                <IncidentStatusBadge status={i.status} className="hidden sm:inline-flex" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}
