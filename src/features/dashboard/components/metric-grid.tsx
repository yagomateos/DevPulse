'use client';

import { Activity, AlertTriangle, Boxes, CheckCircle2, GitPullRequest, HeartPulse, Rocket } from 'lucide-react';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { QueryState } from '@/components/feedback/query-state';
import { useDashboardFilters } from '../hooks/use-dashboard-filters';
import { useMetrics } from '../hooks/use-metrics';
import { MetricCard } from './metric-card';

const icon = (I: typeof Boxes) => <I className="size-3.5" aria-hidden />;

export function MetricGrid() {
  const { query } = useDashboardFilters();
  const metrics = useMetrics(query);
  const project = query.projectId ? `&projectId=${query.projectId}` : '';

  return (
    <QueryState query={metrics} loading={<LoadingSkeleton variant="metrics" rows={4} label="Loading metrics" />} errorTitle="Metrics are unavailable">
      {(m) => (
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard label="Engineering health" metric={m.engineeringHealth} goodWhen="up" icon={icon(HeartPulse)} description="Average project health: incidents, failed deploys and review load." href="/projects" isUpdating={metrics.isPlaceholderData} />
          <MetricCard label="Deployment success" metric={m.deploymentSuccessRate} format={(v) => v.toFixed(1)} unit="%" goodWhen="up" icon={icon(CheckCircle2)} description="Share of deployments that finished successfully in the period." href={`/deployments?status=failed${project}`} isUpdating={metrics.isPlaceholderData} />
          <MetricCard label="Error rate" metric={m.errorRate} format={(v) => v.toFixed(2)} unit="%" goodWhen="down" icon={icon(Activity)} description="Average 5xx rate across services." isUpdating={metrics.isPlaceholderData} />
          <MetricCard label="Active incidents" metric={m.activeIncidents} goodWhen="down" icon={icon(AlertTriangle)} description="Incidents not yet resolved." href="/incidents?status=investigating,identified,monitoring" isUpdating={metrics.isPlaceholderData} />
          <MetricCard label="Deployments" metric={m.deployments} goodWhen="neutral" icon={icon(Rocket)} description="Deployments started in the period." href="/deployments" isUpdating={metrics.isPlaceholderData} />
          <MetricCard label="Open pull requests" metric={m.openPullRequests} goodWhen="down" icon={icon(GitPullRequest)} description="Open and draft pull requests awaiting merge." href="/pull-requests?status=open,draft" isUpdating={metrics.isPlaceholderData} />
          <MetricCard label="Active projects" metric={m.activeProjects} goodWhen="neutral" icon={icon(Boxes)} description="Projects with status Active." href="/projects" isUpdating={metrics.isPlaceholderData} />
        </section>
      )}
    </QueryState>
  );
}
