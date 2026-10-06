'use client';

import { Activity, AlertTriangle, GitBranch, GitPullRequest, LayoutGrid, Rocket, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HealthScore } from '@/components/shared/health-score';
import { NavTabs, type NavTab } from '@/components/shared/nav-tabs';
import { RelativeTime } from '@/components/shared/relative-time';
import { DeploymentStatusBadge, ProjectStatusBadge } from '@/components/status/status-badges';
import { AskAIButton } from '@/features/ai/components/ask-ai-button';
import { useRegisterAIContext } from '@/features/ai/hooks/use-register-ai-context';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { useDialogStore } from '@/stores/dialog-store';
import { useProject } from '../hooks/use-projects';

/** Reads the hydrated project query so optimistic edits (settings) show instantly. */
export function ProjectHeader({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { can } = usePermissions();
  const openDialog = useDialogStore((s) => s.openDialog);
  useRegisterAIContext({ type: 'project', id: projectId, label: project?.name ?? projectId });
  if (!project) return null;

  const base = `/projects/${project.id}`;
  const tabs: NavTab[] = [
    { label: 'Overview', href: base, icon: LayoutGrid, exact: true },
    { label: 'Pull requests', href: `${base}/pull-requests`, icon: GitPullRequest, count: project.openPullRequests },
    { label: 'Deployments', href: `${base}/deployments`, icon: Rocket },
    { label: 'Incidents', href: `${base}/incidents`, icon: AlertTriangle, count: project.activeIncidents || undefined },
    { label: 'Activity', href: `${base}/activity`, icon: Activity },
    ...(can('project:update') ? [{ label: 'Settings', href: `${base}/settings`, icon: Settings }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <HealthScore score={project.healthScore} size={44} showLabel={false} className="mt-0.5" />
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <dt className="sr-only">Repository</dt>
                <dd className="font-mono">{project.repository}</dd>
              </div>
              <div className="flex items-center gap-1">
                <dt className="sr-only">Default branch</dt>
                <GitBranch className="size-3.5" aria-hidden />
                <dd className="font-mono">{project.defaultBranch}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt>Last deploy</dt>
                <dd className="flex items-center gap-1.5">
                  <DeploymentStatusBadge status={project.deploymentStatus} /> <RelativeTime value={project.lastDeploymentAt} />
                </dd>
              </div>
              <div className="flex items-center gap-1">
                <dt>Health</dt>
                <dd className="font-medium tabular-nums text-foreground">{project.healthScore}/100</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AskAIButton prompt="Why is this project unhealthy?">Ask AI</AskAIButton>
          <PermissionGate permission="incident:create">
            <Button size="sm" variant="outline" onClick={() => openDialog('create-incident', { projectId: project.id })}>
              <AlertTriangle /> Declare incident
            </Button>
          </PermissionGate>
        </div>
      </div>
      <NavTabs tabs={tabs} label="Project sections" />
    </div>
  );
}
