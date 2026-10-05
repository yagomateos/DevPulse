'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => api.getDashboardMetrics(),
  });
}

export function useDeploymentChart() {
  return useQuery({
    queryKey: ['dashboard', 'deployment-chart'],
    queryFn: () => api.getDeploymentChart(),
  });
}

export function usePerformanceChart() {
  return useQuery({
    queryKey: ['dashboard', 'performance-chart'],
    queryFn: () => api.getPerformanceChart(),
  });
}

export function useActivityFeed() {
  return useQuery({
    queryKey: ['dashboard', 'activity-feed'],
    queryFn: () => api.getActivityFeed(),
  });
}
