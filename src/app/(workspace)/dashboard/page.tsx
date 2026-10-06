import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { PageHeader } from '@/components/shared/page-header';
import { ActivityFeed } from '@/features/dashboard/components/activity-feed';
import { DeploymentChartPanel, PerformanceChartPanel } from '@/features/dashboard/components/chart-panels';
import { DashboardFilters } from '@/features/dashboard/components/dashboard-filters';
import { DashboardTabs } from '@/features/dashboard/components/dashboard-tabs';
import { DeploymentList } from '@/features/dashboard/components/deployment-list';
import { IncidentList } from '@/features/dashboard/components/incident-list';
import { MetricGrid } from '@/features/dashboard/components/metric-grid';
import { SectionCard } from '@/features/dashboard/components/section-card';
import { queryKeys } from '@/lib/query-keys';
import { dashboardQuerySchema, type DashboardQuery } from '@/schemas/query';
import { getSession } from '@/server/auth/session';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';

export const metadata: Metadata = { title: 'Dashboard' };

/** Streams independently: metrics render as soon as they resolve. */
async function MetricsSection({ query }: { query: DashboardQuery }) {
  const repo = await getRepository();
  const [metrics, deploys, perf] = await Promise.all([repo.analytics.metrics(query), repo.analytics.deploymentSeries(query), repo.analytics.performanceSeries(query)]);
  return (
    <Hydrate
      queries={[
        [queryKeys.dashboard.metrics(query), metrics],
        [queryKeys.dashboard.deployments(query), deploys],
        [queryKeys.dashboard.performance(query), perf],
      ]}
    >
      <MetricGrid />
    </Hydrate>
  );
}

async function ActivitySection({ projectId }: { projectId?: string }) {
  const activity = await (await getRepository()).analytics.activity({ projectId, limit: 10 });
  return (
    <Hydrate queries={[[queryKeys.activity(projectId, 10), activity]]}>
      <ActivityFeed projectId={projectId} limit={10} />
    </Hydrate>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const parsed = dashboardQuerySchema.safeParse(await searchParams);
  const query: DashboardQuery = parsed.success ? parsed.data : { range: '7d' };
  const session = await getSession();
  const firstName = session?.user.name.split(' ')[0];

  const charts = (
    <div className="grid gap-4 lg:grid-cols-2">
      <DeploymentChartPanel />
      <PerformanceChartPanel />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title={`Good to see you, ${firstName}`} description="Delivery and reliability across your engineering organisation." actions={<DashboardFilters />} />
      <Suspense key={JSON.stringify(query)} fallback={<LoadingSkeleton variant="metrics" rows={4} label="Loading metrics" />}>
        <MetricsSection query={query} />
      </Suspense>
      <DashboardTabs
        panels={{
          overview: (
            <>
              {charts}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <SectionCard title="Active incidents" href="/incidents?status=investigating,identified,monitoring">
                    <IncidentList projectId={query.projectId} />
                  </SectionCard>
                  <SectionCard title="Recent deployments" href="/deployments">
                    <DeploymentList projectId={query.projectId} environment={query.environment} />
                  </SectionCard>
                </div>
                <SectionCard title="Activity" description="Merges, releases and incidents">
                  <Suspense fallback={<LoadingSkeleton variant="list" rows={6} />}>
                    <ActivitySection projectId={query.projectId} />
                  </Suspense>
                </SectionCard>
              </div>
            </>
          ),
          delivery: (
            <>
              <DeploymentChartPanel />
              <SectionCard title="Recent deployments" href="/deployments">
                <DeploymentList projectId={query.projectId} environment={query.environment} limit={10} />
              </SectionCard>
            </>
          ),
          reliability: (
            <>
              <PerformanceChartPanel />
              <SectionCard title="Active incidents" href="/incidents">
                <IncidentList projectId={query.projectId} limit={10} />
              </SectionCard>
            </>
          ),
        }}
      />
    </div>
  );
}
