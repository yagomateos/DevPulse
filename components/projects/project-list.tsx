'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/use-projects';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/shared/states';
import {
  ProjectStatusBadge,
  DeploymentStatusBadge,
  HealthScoreBadge,
} from '@/components/shared/status-badges';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';
import {
  LayoutGrid,
  List,
  GitBranch,
  Star,
  Users,
  GitPullRequest,
  AlertTriangle,
  FolderGit2,
} from 'lucide-react';
import type { Project } from '@/types';

export function ProjectList({ compact = false }: { compact?: boolean }) {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const [view, setView] = useState<'grid' | 'list'>('grid');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {!compact && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-20" />
          </div>
        )}
        <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
          {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load projects"
        description="Could not fetch project data. Please try again."
        onRetry={refetch}
      />
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        title="No projects found"
        description="Create your first project to get started."
        icon={FolderGit2}
      />
    );
  }

  const displayProjects = compact ? projects.slice(0, 4) : projects;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Projects ({projects.length})
          </h2>
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {view === 'grid' || compact ? (
        <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
          {displayProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={displayProjects} />
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full transition-all hover:border-primary/30 hover:shadow-sm cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {project.repository}
              </p>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-3 min-h-[2rem]">
            {project.description}
          </p>

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {project.branch}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {project.stars}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.contributors}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <DeploymentStatusBadge status={project.deploymentStatus} showDot={false} />
              <HealthScoreBadge score={project.healthScore} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <GitPullRequest className="h-3 w-3" />
                {project.openPRs}
              </span>
              {project.incidents > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  {project.incidents}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Last deployed {formatRelativeTime(project.lastDeployment)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <div className="divide-y">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                <ProjectStatusBadge status={project.status} />
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {project.repository} · {project.branch}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">PRs</p>
                <p className="text-sm font-medium tabular-nums">{project.openPRs}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Incidents</p>
                <p className={cn(
                  'text-sm font-medium tabular-nums',
                  project.incidents > 0 && 'text-destructive'
                )}>
                  {project.incidents}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Health</p>
                <p className="text-sm font-medium tabular-nums">{project.healthScore}</p>
              </div>
            </div>
            <DeploymentStatusBadge status={project.deploymentStatus} showDot={false} />
          </Link>
        ))}
      </div>
    </Card>
  );
}
