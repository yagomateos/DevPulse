'use client';

import { FolderPlus, LayoutGrid, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/toolbar';
import { useDataTableUrlState } from '@/components/data-table/use-data-table-url-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import { useUrlState } from '@/hooks/use-url-state';
import { useDialogStore } from '@/stores/dialog-store';
import { PROJECT_STATUSES } from '@/types/domain';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { useProjects } from '../hooks/use-projects';
import { filterProjects } from '../lib';
import { projectColumns } from './project-columns';
import { ProjectCard } from './project-card';

type View = 'grid' | 'list';
const FACETS = [{ key: 'status', title: 'Status', options: PROJECT_STATUSES.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s })) }];
const DEFAULT_SORT = { id: 'name', desc: false };

/**
 * One state (URL), two presentations. Grid and list share search, filters and
 * sorting; switching views never loses context.
 */
export function ProjectsView() {
  const router = useRouter();
  const url = useUrlState();
  const view: View = url.get('view') === 'list' ? 'list' : 'grid';
  const state = useDataTableUrlState({ filterKeys: ['status'] as const, defaultSort: DEFAULT_SORT, defaultPageSize: 20 });
  const projects = useProjects();
  const openDialog = useDialogStore((s) => s.openDialog);

  const visible = useMemo(
    () => filterProjects(projects.data ?? [], { search: state.search, status: state.filters.status, sort: state.sorting[0] }),
    [projects.data, state.search, state.filters.status, state.sorting],
  );

  const createButton = (
    <PermissionGate permission="project:create">
      <Button size="sm" onClick={() => openDialog('create-project')}>
        <FolderPlus /> New project
      </Button>
    </PermissionGate>
  );
  const viewToggle = (
    <ToggleGroup type="single" value={view} onValueChange={(v) => v && url.set({ view: v === 'grid' ? null : v })} aria-label="View">
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List />
      </ToggleGroupItem>
    </ToggleGroup>
  );

  // The grid reuses the DataTable toolbar; it needs a table instance for the column menu.
  const toolbarTable = useReactTable({ data: [], columns: projectColumns, getCoreRowModel: getCoreRowModel() });

  if (view === 'list') {
    return (
      <DataTable
        tableId="projects"
        label="Projects"
        columns={projectColumns}
        data={projects.data}
        getRowId={(p) => p.id}
        state={state}
        onSortingChange={state.setSorting}
        onPaginationChange={state.setPagination}
        onSearchChange={state.setSearch}
        onFilterChange={(k, v) => state.setFilter(k as 'status', v)}
        onReset={state.reset}
        facets={FACETS}
        searchPlaceholder="Search projects…"
        isLoading={projects.isPending}
        error={projects.error}
        onRetry={() => projects.refetch()}
        onRowActivate={(p) => router.push(`/projects/${p.id}`)}
        renderMobileCard={(p) => <ProjectCard project={p} />}
        toolbarActions={
          <>
            {viewToggle}
            {createButton}
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <DataTableToolbar
        table={toolbarTable}
        search={state.search}
        onSearchChange={state.setSearch}
        searchPlaceholder="Search projects…"
        facets={FACETS}
        filters={state.filters}
        onFilterChange={(k, v) => state.setFilter(k as 'status', v)}
        isFiltered={state.isFiltered}
        onReset={state.reset}
        actions={
          <>
            {viewToggle}
            {createButton}
          </>
        }
      />
      {projects.isPending ? (
        <LoadingSkeleton variant="cards" rows={6} label="Loading projects" />
      ) : projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => projects.refetch()} isRetrying={projects.isRefetching} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={state.isFiltered ? 'No projects match your filters' : 'No projects yet'}
          description={state.isFiltered ? 'Try another search or clear filters.' : 'Create your first project to start tracking delivery.'}
          action={state.isFiltered ? <Button size="sm" variant="outline" onClick={state.reset}>Clear filters</Button> : createButton}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Projects">
          {visible.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
