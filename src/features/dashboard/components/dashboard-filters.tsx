'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { DATE_RANGES, ENVIRONMENTS, type DateRange } from '@/types/domain';
import { useDashboardFilters } from '../hooks/use-dashboard-filters';

const ALL = 'all';

export function DashboardFilters() {
  const { query, setRange, setProject, setEnvironment, reset, isFiltered } = useDashboardFilters();
  const projects = useProjects();
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Dashboard filters">
      <ToggleGroup type="single" value={query.range} onValueChange={(v) => v && setRange(v as DateRange)} aria-label="Date range">
        {DATE_RANGES.map((r) => (
          <ToggleGroupItem key={r} value={r} aria-label={`Last ${r}`}>
            {r}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Select value={query.projectId ?? ALL} onValueChange={(v) => setProject(v === ALL ? null : v)}>
        <SelectTrigger className="h-8 w-[180px] text-[13px]" aria-label="Project">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All projects</SelectItem>
          {projects.data?.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={query.environment ?? ALL} onValueChange={(v) => setEnvironment(v === ALL ? null : v)}>
        <SelectTrigger className="h-8 w-[150px] text-[13px]" aria-label="Environment">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All environments</SelectItem>
          {ENVIRONMENTS.map((e) => (
            <SelectItem key={e} value={e} className="capitalize">
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={reset}>
          Reset <X />
        </Button>
      )}
    </div>
  );
}
