'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardQuery } from '@/schemas/query';
import { dashboardQueries } from '@/services/dashboard';

export function useMetrics(query: DashboardQuery) {
  return useQuery(dashboardQueries.metrics(query));
}

export function useDeploymentSeries(query: DashboardQuery) {
  return useQuery(dashboardQueries.deploymentSeries(query));
}

export function usePerformanceSeries(query: DashboardQuery) {
  return useQuery(dashboardQueries.performanceSeries(query));
}

export function useActivity(projectId?: string, limit?: number) {
  return useQuery(dashboardQueries.activity(projectId, limit));
}
