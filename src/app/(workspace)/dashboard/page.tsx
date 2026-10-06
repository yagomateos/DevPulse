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
  const metrics = await (await getRepository()).analytics.metrics(query);
  return (
    <Hydrate queries={[[queryKeys.dashboard.metrics(query), metrics]]}>
      <MetricGrid />
    </Hydrate>
  );
}

/**
 * Charts render inside the boundary that hydrates their series, so the
 * server and the client always render the same branch (no hydration race).
 */
async function ChartsSection({ query, charts }: { query: DashboardQuery; charts: ('deployments' | 'performance')[] }) {
  const repo = await getRepository();
  const [deploys, perf] = await Promise.all([
    charts.includes('deployments') ? repo.analytics.deploymentSeries(query) : null,
    charts.includes('performance') ? repo.analytics.performanceSeries(query) : null,
  ]);
  return (
    <Hydrate
      queries={[
        ...(deploys ? ([[queryKeys.dashboard.deployments(query), deploys]] as const) : []),
        ...(perf ? ([[queryKeys.dashboard.performance(query), perf]] as const) : []),
      ]}
    >
      <div className={charts.length > 1 ? 'grid gap-4 lg:grid-cols-2' : undefined}>
        {charts.includes('deployments') && <DeploymentChartPanel />}
        {charts.includes('performance') && <PerformanceChartPanel />}
      </div>
    </Hydrate>
  );
}

function ChartsFallback({ count }: { count: number }) {
  return (
    <div className={count > 1 ? 'grid gap-4 lg:grid-cols-2' : undefined}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} variant="chart" />
      ))}
    </div>
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
    <Suspense fallback={<ChartsFallback count={2} />}>
      <ChartsSection query={query} charts={['deployments', 'performance']} />
    </Suspense>
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
              <Suspense fallback={<ChartsFallback count={1} />}>
                <ChartsSection query={query} charts={['deployments']} />
              </Suspense>
              <SectionCard title="Recent deployments" href="/deployments">
                <DeploymentList projectId={query.projectId} environment={query.environment} limit={10} />
              </SectionCard>
            </>
          ),
          reliability: (
            <>
              <Suspense fallback={<ChartsFallback count={1} />}>
                <ChartsSection query={query} charts={['performance']} />
              </Suspense>
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
