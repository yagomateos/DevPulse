'use client';

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { QueryState } from '@/components/feedback/query-state';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardFilters } from '../hooks/use-dashboard-filters';
import { useDeploymentSeries, usePerformanceSeries } from '../hooks/use-metrics';

// Recharts is the heaviest client dependency: load it on demand, client-only.
const chartFallback = () => <Skeleton className="h-[252px] w-full" />;
const DeploymentChart = dynamic(() => import('./deployment-chart'), { ssr: false, loading: chartFallback });
const PerformanceChart = dynamic(() => import('./performance-chart'), { ssr: false, loading: chartFallback });

export function DeploymentChartPanel() {
  const { query } = useDashboardFilters();
  const series = useDeploymentSeries(query);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployments</CardTitle>
        <CardDescription>Successful vs. failed · click a bar to drill down</CardDescription>
      </CardHeader>
      <div className="px-4 pb-4">
        <QueryState query={series} loading={<LoadingSkeleton variant="chart" />} compactError>
          {(data) => <DeploymentChart data={data} range={query.range} projectId={query.projectId} />}
        </QueryState>
      </div>
    </Card>
  );
}

export function PerformanceChartPanel() {
  const { query } = useDashboardFilters();
  const series = usePerformanceSeries(query);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance</CardTitle>
        <CardDescription>Latency and error rate across services</CardDescription>
      </CardHeader>
      <div className="px-4 pb-4">
        <QueryState query={series} loading={<LoadingSkeleton variant="chart" />} compactError>
          {(data) => <PerformanceChart data={data} range={query.range} />}
        </QueryState>
      </div>
    </Card>
  );
}
