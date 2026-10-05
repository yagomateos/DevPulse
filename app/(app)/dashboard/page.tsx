'use client';

import { useState } from 'react';
import { MetricGrid } from '@/components/dashboard/metric-grid';
import { DeploymentChart, PerformanceChart } from '@/components/dashboard/charts';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectList } from '@/components/projects/project-list';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function DashboardContent() {
  const [range, setRange] = useState('7d');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const tab = searchParams.get('tab') || 'overview';

  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your engineering metrics across all projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {tab === 'overview' && (
          <div className="mt-6 space-y-6 animate-fade-in">
            <MetricGrid />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DeploymentChart />
              <PerformanceChart />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ActivityFeed />
              </div>
              <ProjectList compact />
            </div>
          </div>
        )}

        {tab === 'deployments' && (
          <div className="mt-6 space-y-6 animate-fade-in">
            <MetricGrid />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DeploymentChart />
              <PerformanceChart />
            </div>
          </div>
        )}

        {tab === 'projects' && (
          <div className="mt-6 animate-fade-in">
            <ProjectList />
          </div>
        )}
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>}>
      <DashboardContent />
    </Suspense>
  );
}
