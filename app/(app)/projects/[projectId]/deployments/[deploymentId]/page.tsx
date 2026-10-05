'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDeployment, useAnalyzeDeployment } from '@/hooks/use-deployments';
import { useProject } from '@/hooks/use-projects';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { DeploymentStatusBadge } from '@/components/shared/status-badges';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDateTime, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  Bot,
  Loader2,
  ExternalLink,
  Clock,
  Server,
  Gauge,
  AlertCircle,
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const logLevelColors: Record<string, string> = {
  info: 'text-muted-foreground',
  warn: 'text-warning',
  error: 'text-destructive',
  debug: 'text-info',
};

export default function DeploymentDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const deploymentId = params.deploymentId as string;
  const { data: project } = useProject(projectId);
  const { data: deployment, isLoading, isError, refetch } = useDeployment(deploymentId);
  const analyze = useAnalyzeDeployment();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !deployment) {
    return <ErrorState title="Deployment not found" onRetry={refetch} />;
  }

  const handleAnalyze = () => {
    analyze.mutate(deploymentId);
  };

  return (
    <div className="space-y-6">
      <Link href={`/projects/${projectId}/deployments`}>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Deployments
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg text-primary">{deployment.commitSha}</span>
            <DeploymentStatusBadge status={deployment.status} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{deployment.commitMessage}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              {deployment.branch}
            </span>
            <span className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              {deployment.environment}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDateTime(deployment.startTime)}
            </span>
            {deployment.endTime && (
              <span>Duration: {formatDuration(deployment.duration)}</span>
            )}
          </div>
        </div>
        {deployment.url && (
          <Button variant="outline" size="sm" asChild>
            <a href={deployment.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View deployment
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Tests
                    </div>
                    <p className="text-lg font-semibold mt-1">
                      {deployment.testsPassed}/{deployment.testsTotal}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Duration
                    </div>
                    <p className="text-lg font-semibold mt-1">
                      {deployment.endTime ? formatDuration(deployment.duration) : '—'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Server className="h-3.5 w-3.5" />
                      Environment
                    </div>
                    <p className="text-lg font-semibold mt-1 capitalize">{deployment.environment}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Commit Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={deployment.authorAvatar} alt={deployment.author} />
                      <AvatarFallback>{deployment.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{deployment.author}</p>
                      <p className="text-xs text-muted-foreground">
                        Deployed {formatDateTime(deployment.startTime)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{deployment.commitSha}</span>
                  </div>
                  <p className="text-sm">{deployment.commitMessage}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px] rounded-lg">
                    <div className="font-mono text-xs">
                      {deployment.logs.map((log, i) => (
                        <div
                          key={log.id}
                          className={cn(
                            'flex gap-3 px-4 py-1.5 border-b border-border/50 hover:bg-muted/30',
                            log.level === 'error' && 'bg-destructive/5'
                          )}
                        >
                          <span className="text-muted-foreground shrink-0 tabular-nums">
                            {String(i + 1).padStart(3, '0')}
                          </span>
                          <span className={cn('shrink-0 font-bold uppercase w-12', logLevelColors[log.level])}>
                            {log.level}
                          </span>
                          <span className="text-foreground">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              {deployment.metrics.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {deployment.metrics.map((metric) => {
                    const isPositive = metric.change < 0;
                    const isNegative = metric.change > 0;
                    const isNeutral = metric.change === 0;
                    return (
                      <Card key={metric.label}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">{metric.label}</p>
                            {isPositive && <TrendingDown className="h-3.5 w-3.5 text-success" />}
                            {isNegative && <TrendingUp className="h-3.5 w-3.5 text-destructive" />}
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-semibold tabular-nums">
                              {metric.value}
                            </span>
                            <span className="text-sm text-muted-foreground">{metric.unit}</span>
                          </div>
                          {!isNeutral && (
                            <p className={cn(
                              'text-xs mt-1',
                              isPositive ? 'text-success' : 'text-destructive'
                            )}>
                              {isPositive ? '' : '+'}{metric.change} {metric.unit} vs previous
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No metrics available"
                  description="Performance metrics will appear here once the deployment completes."
                  icon={Activity}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI Analysis
              </CardTitle>
              <CardDescription>Investigate deployment issues with AI</CardDescription>
            </CardHeader>
            <CardContent>
              {!analyze.data && !analyze.isPending && (
                <Button onClick={handleAnalyze} className="w-full gap-2">
                  <Bot className="h-4 w-4" />
                  Analyze Deployment
                </Button>
              )}
              {analyze.isPending && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing deployment...</p>
                </div>
              )}
              {analyze.data && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={cn(
                        'h-5 w-5',
                        analyze.data.risk === 'low' ? 'text-success' : 'text-destructive'
                      )} />
                      <span className="text-sm font-medium">Risk Level</span>
                    </div>
                    <Badge variant="outline" className={cn(
                      'capitalize',
                      analyze.data.risk === 'low' && 'border-success/30 bg-success/10 text-success',
                      analyze.data.risk === 'medium' && 'border-warning/30 bg-warning/10 text-warning',
                      analyze.data.risk === 'high' && 'border-destructive/30 bg-destructive/10 text-destructive',
                    )}>
                      {analyze.data.risk}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Possible Cause</p>
                    <p className="text-sm text-muted-foreground">{analyze.data.possibleCause}</p>
                  </div>

                  {analyze.data.evidence.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence</p>
                        <ul className="space-y-1.5">
                          {analyze.data.evidence.map((ev, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary shrink-0">•</span>
                              {ev}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {analyze.data.affectedAreas.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Affected Areas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {analyze.data.affectedAreas.map((area) => (
                            <Badge key={area} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended Actions</p>
                    <ul className="space-y-1.5">
                      {analyze.data.recommendedActions.map((action, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <Gauge className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Confidence: {Math.round(analyze.data.confidence * 100)}%
                  </p>

                  <Button variant="outline" size="sm" onClick={handleAnalyze} className="w-full">
                    Re-analyze
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {project && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/projects/${project.id}`} className="text-sm text-primary hover:underline">
                  {project.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">{project.repository}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
