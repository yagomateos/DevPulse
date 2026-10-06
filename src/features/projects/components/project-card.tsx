import { AlertTriangle, GitBranch, GitPullRequest } from 'lucide-react';
import Link from 'next/link';
import { HealthScore } from '@/components/shared/health-score';
import { RelativeTime } from '@/components/shared/relative-time';
import { DeploymentStatusBadge, ProjectStatusBadge } from '@/components/status/status-badges';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/domain';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn('group flex h-full flex-col gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30', project.status === 'archived' && 'opacity-70')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold group-hover:text-primary">{project.name}</h3>
          <p className="truncate font-mono text-xs text-muted-foreground">{project.repository}</p>
        </div>
        <HealthScore score={project.healthScore} size={34} />
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <ProjectStatusBadge status={project.status} />
        <DeploymentStatusBadge status={project.deploymentStatus} />
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
        <div>
          <dt className="sr-only">Open pull requests</dt>
          <dd className="flex items-center gap-1 text-muted-foreground">
            <GitPullRequest className="size-3.5" aria-hidden /> <span className="tabular-nums text-foreground">{project.openPullRequests}</span> PRs
          </dd>
        </div>
        <div>
          <dt className="sr-only">Active incidents</dt>
          <dd className={cn('flex items-center gap-1 text-muted-foreground', project.activeIncidents > 0 && 'text-destructive')}>
            <AlertTriangle className="size-3.5" aria-hidden /> <span className="tabular-nums">{project.activeIncidents}</span> incidents
          </dd>
        </div>
        <div className="text-right">
          <dt className="sr-only">Branch and last deployment</dt>
          <dd className="flex items-center justify-end gap-1 text-muted-foreground">
            <GitBranch className="size-3.5" aria-hidden />
            <RelativeTime value={project.lastDeploymentAt} />
          </dd>
        </div>
      </dl>
    </Link>
  );
}
