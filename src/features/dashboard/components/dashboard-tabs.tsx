'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardFilters, type DashboardTab } from '../hooks/use-dashboard-filters';

/** URL-synced tabs; panels are server-rendered slots passed in by the page. */
export function DashboardTabs({ panels }: { panels: Record<DashboardTab, ReactNode> }) {
  const { tab, setTab } = useDashboardFilters();
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as DashboardTab)}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="delivery">Delivery</TabsTrigger>
        <TabsTrigger value="reliability">Reliability</TabsTrigger>
      </TabsList>
      {(Object.keys(panels) as DashboardTab[]).map((key) => (
        <TabsContent key={key} value={key} className="mt-4 space-y-4 focus-visible:ring-0">
          {panels[key]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
