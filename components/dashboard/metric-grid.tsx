'use client';

import { MetricCard } from './metric-card';
import { useDashboardMetrics } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderGit2,
  GitPullRequest,
  Rocket,
  AlertTriangle,
  TrendingUp,
  Activity,
  Heart,
} from 'lucide-react';

export function MetricGrid() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Active Projects"
        value={metrics.activeProjects}
        trend={metrics.trends.activeProjects}
        trendLabel="vs last week"
        icon={FolderGit2}
      />
      <MetricCard
        label="Open Pull Requests"
        value={metrics.openPRs}
        trend={metrics.trends.openPRs}
        trendLabel="vs last week"
        icon={GitPullRequest}
        accent="info"
      />
      <MetricCard
        label="Recent Deployments"
        value={metrics.recentDeployments}
        trend={metrics.trends.recentDeployments}
        trendLabel="vs last week"
        icon={Rocket}
        accent="success"
      />
      <MetricCard
        label="Active Incidents"
        value={metrics.activeIncidents}
        trend={metrics.trends.activeIncidents}
        trendLabel="vs last week"
        icon={AlertTriangle}
        accent="destructive"
      />
      <MetricCard
        label="Deployment Success Rate"
        value={`${metrics.deploymentSuccessRate}%`}
        trend={metrics.trends.deploymentSuccessRate}
        trendLabel="vs last week"
        icon={TrendingUp}
        accent="success"
      />
      <MetricCard
        label="Error Rate"
        value={`${metrics.errorRate}%`}
        trend={metrics.trends.errorRate}
        trendLabel="vs last week"
        icon={Activity}
        accent="warning"
      />
      <MetricCard
        label="Engineering Health"
        value={`${metrics.engineeringHealth}/100`}
        trend={metrics.trends.engineeringHealth}
        trendLabel="vs last week"
        icon={Heart}
      />
    </div>
  );
}
