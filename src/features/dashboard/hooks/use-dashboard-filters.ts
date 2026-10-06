'use client';

import { useMemo } from 'react';
import { useUrlState } from '@/hooks/use-url-state';
import { dashboardQuerySchema, type DashboardQuery } from '@/schemas/query';

export const DASHBOARD_TABS = ['overview', 'delivery', 'reliability'] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

/** Dashboard filters live in the URL: shareable, back-button friendly, SSR-able. */
export function useDashboardFilters() {
  const url = useUrlState();
  const raw = url.searchParams.toString();
  const query: DashboardQuery = useMemo(() => {
    const parsed = dashboardQuerySchema.safeParse(Object.fromEntries(new URLSearchParams(raw)));
    return parsed.success ? parsed.data : { range: '7d' };
  }, [raw]);
  const tabParam = url.get('tab');
  const tab: DashboardTab = DASHBOARD_TABS.includes(tabParam as DashboardTab) ? (tabParam as DashboardTab) : 'overview';

  return {
    query,
    tab,
    setRange: (range: DashboardQuery['range']) => url.set({ range: range === '7d' ? null : range }),
    setProject: (projectId: string | null) => url.set({ projectId }),
    setEnvironment: (environment: string | null) => url.set({ environment }),
    setTab: (next: DashboardTab) => url.set({ tab: next === 'overview' ? null : next }),
    reset: () => url.set({ range: null, projectId: null, environment: null }),
    isFiltered: query.range !== '7d' || !!query.projectId || !!query.environment,
  };
}
