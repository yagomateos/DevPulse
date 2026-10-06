import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { DashboardQuery } from '@/schemas/query';
import type { ActivityItem, DashboardMetrics, DeploymentSeriesPoint, PerformanceSeriesPoint } from '@/types/domain';

export const dashboardService = {
  metrics: (q: DashboardQuery) => apiFetch<DashboardMetrics>('/api/dashboard/metrics', { query: q }),
  deploymentSeries: (q: DashboardQuery) => apiFetch<DeploymentSeriesPoint[]>('/api/dashboard/deployments', { query: q }),
  performanceSeries: (q: DashboardQuery) => apiFetch<PerformanceSeriesPoint[]>('/api/dashboard/performance', { query: q }),
  activity: (projectId?: string, limit?: number) => apiFetch<ActivityItem[]>('/api/activity', { query: { projectId, limit } }),
};

export const dashboardQueries = {
  metrics: (q: DashboardQuery) => queryOptions({ queryKey: queryKeys.dashboard.metrics(q), queryFn: () => dashboardService.metrics(q), placeholderData: keepPreviousData }),
  deploymentSeries: (q: DashboardQuery) =>
    queryOptions({ queryKey: queryKeys.dashboard.deployments(q), queryFn: () => dashboardService.deploymentSeries(q), placeholderData: keepPreviousData }),
  performanceSeries: (q: DashboardQuery) =>
    queryOptions({ queryKey: queryKeys.dashboard.performance(q), queryFn: () => dashboardService.performanceSeries(q), placeholderData: keepPreviousData }),
  activity: (projectId?: string, limit?: number) =>
    queryOptions({ queryKey: queryKeys.activity(projectId, limit), queryFn: () => dashboardService.activity(projectId, limit) }),
};
