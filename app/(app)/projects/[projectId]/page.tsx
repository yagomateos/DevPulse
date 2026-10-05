'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import {
  ProjectStatusBadge,
  DeploymentStatusBadge,
  HealthScoreBadge,
} from '@/components/shared/status-badges';
import { formatRelativeTime, formatDate } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GitBranch,
  GitPullRequest,
  Rocket,
  AlertTriangle,
  Activity,
  Star,
  Users,
  Calendar,
  FolderGit2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePullRequests } from '@/hooks/use-pull-requests';
import { useDeployments } from '@/hooks/use-deployments';
import { useIncidents } from '@/hooks/use-incidents';
import { projects } from '@/lib/mock-data';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: project, isLoading, isError, refetch } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <ErrorState
        title="Project not found"
        description="This project may have been deleted or you don't have access."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/projects">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {project.repository}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {project.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusBadge status={project.status} />
          <DeploymentStatusBadge status={project.deploymentStatus} />
          <HealthScoreBadge score={project.healthScore} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GitBranch className="h-3.5 w-3.5" />
              Branch
            </div>
            <p className="text-sm font-medium mt-1">{project.branch}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GitPullRequest className="h-3.5 w-3.5" />
              Open PRs
            </div>
            <p className="text-sm font-medium mt-1 tabular-nums">{project.openPRs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              Incidents
            </div>
            <p className="text-sm font-medium mt-1 tabular-nums">
              {project.incidents}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Contributors
            </div>
            <p className="text-sm font-medium mt-1 tabular-nums">
              {project.contributors}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5" />
              Stars
            </div>
            <p className="text-sm font-medium mt-1 tabular-nums">{project.stars}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Created
            </div>
            <p className="text-sm font-medium mt-1">{formatDate(project.createdAt, 'MMM yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <ProjectTabs projectId={projectId} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Last Deployment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Deployed {formatRelativeTime(project.lastDeployment)} to production
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectTabs({ projectId }: { projectId: string }) {
  const params = useParams();
  const currentTab = (params.tab as string) || 'overview';

  const tabs = [
    { label: 'Overview', value: 'overview', href: `/projects/${projectId}` },
    { label: 'Pull Requests', value: 'prs', href: `/projects/${projectId}/pull-requests` },
    { label: 'Deployments', value: 'deployments', href: `/projects/${projectId}/deployments` },
    { label: 'Incidents', value: 'incidents', href: `/projects/${projectId}/incidents` },
    { label: 'Activity', value: 'activity', href: `/projects/${projectId}?tab=activity` },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={currentTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={tab.href}>{tab.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {currentTab === 'overview' && <ProjectOverview projectId={projectId} />}
    </div>
  );
}

function ProjectOverview({ projectId }: { projectId: string }) {
  const { data: prs } = usePullRequests(projectId);
  const { data: deployments } = useDeployments(projectId);
  const { data: incidents } = useIncidents(projectId);
  const project = projects.find((p) => p.id === projectId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitPullRequest className="h-4 w-4" />
            Recent Pull Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prs && prs.length > 0 ? (
            <div className="space-y-2">
              {prs.slice(0, 5).map((pr) => (
                <Link
                  key={pr.id}
                  href={`/projects/${projectId}/pull-requests/${pr.id}`}
                  className="flex items-center gap-2 rounded-md p-2 hover:bg-accent/50 transition-colors"
                >
                  <span className="text-xs font-mono text-muted-foreground">
                    #{pr.number}
                  </span>
                  <span className="text-sm truncate flex-1">{pr.title}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No pull requests" className="border-0" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Recent Deployments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deployments && deployments.length > 0 ? (
            <div className="space-y-2">
              {deployments.slice(0, 5).map((dep) => (
                <Link
                  key={dep.id}
                  href={`/projects/${projectId}/deployments/${dep.id}`}
                  className="flex items-center gap-2 rounded-md p-2 hover:bg-accent/50 transition-colors"
                >
                  <span className="text-xs font-mono text-muted-foreground">
                    {dep.commitSha}
                  </span>
                  <span className="text-sm truncate flex-1">{dep.commitMessage}</span>
                  <DeploymentStatusBadge status={dep.status} showDot={false} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No deployments" className="border-0" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidents && incidents.length > 0 ? (
            <div className="space-y-2">
              {incidents.slice(0, 5).map((inc) => (
                <Link
                  key={inc.id}
                  href={`/projects/${projectId}/incidents/${inc.id}`}
                  className="flex items-center gap-2 rounded-md p-2 hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm truncate flex-1">{inc.title}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No incidents" className="border-0" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Language</span>
            <span className="font-medium">{project?.language}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tags</span>
            <div className="flex gap-1">
              {project?.tags.map((tag) => (
                <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Health Score</span>
            <span className="font-medium tabular-nums">{project?.healthScore}/100</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
