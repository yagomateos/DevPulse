'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePullRequest, useAnalyzePR } from '@/hooks/use-pull-requests';
import { useProject } from '@/hooks/use-projects';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import {
  PRStatusBadge,
  RiskBadge,
  RiskScoreBar,
} from '@/components/shared/status-badges';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime, formatDateTime } from '@/lib/format';
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  FileCode,
  CheckCircle,
  XCircle,
  MessageSquare,
  Bot,
  Loader2,
  Shield,
  Gauge,
  Eye,
  Type,
  FlaskConical,
  Wrench,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import type { AIFinding } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const categoryIcons: Record<AIFinding['category'], React.ComponentType<{ className?: string }>> = {
  Security: Shield,
  Performance: Gauge,
  Accessibility: Eye,
  'Type Safety': Type,
  Testing: FlaskConical,
  Maintainability: Wrench,
};

const severityColors: Record<string, string> = {
  low: 'border-success/30 bg-success/5 text-success',
  medium: 'border-warning/30 bg-warning/5 text-warning',
  high: 'border-destructive/30 bg-destructive/5 text-destructive',
  critical: 'border-destructive/40 bg-destructive/10 text-destructive',
};

export default function PRDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const prId = params.prId as string;
  const { data: project } = useProject(projectId);
  const { data: pr, isLoading, isError, refetch } = usePullRequest(prId);
  const analyze = useAnalyzePR();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !pr) {
    return (
      <ErrorState
        title="Pull request not found"
        onRetry={refetch}
      />
    );
  }

  const handleAnalyze = () => {
    analyze.mutate(prId, {
      onSuccess: () => toast.success('AI analysis complete'),
      onError: () => toast.error('Analysis failed. Please try again.'),
    });
  };

  return (
    <div className="space-y-6">
      <Link href={`/projects/${projectId}/pull-requests`}>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Pull Requests
        </Button>
      </Link>

      {/* PR Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="font-mono text-lg text-muted-foreground">#{pr.number}</span>
          <h1 className="text-xl font-semibold tracking-tight flex-1">{pr.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PRStatusBadge status={pr.status} />
          <RiskBadge level={pr.riskLevel} />
          {pr.labels.map((label) => (
            <Badge key={label} variant="secondary" className="text-xs">
              {label}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{pr.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            {pr.branch} → {pr.baseBranch}
          </span>
          <span className="flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5" />
            {pr.filesChanged} files
          </span>
          <span className="font-mono">
            <span className="text-success">+{pr.additions}</span>{' '}
            <span className="text-destructive">-{pr.deletions}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="commits">Commits ({pr.commits.length})</TabsTrigger>
              <TabsTrigger value="files">Files ({pr.fileChanges.length})</TabsTrigger>
              <TabsTrigger value="checks">Checks ({pr.checks.length})</TabsTrigger>
              <TabsTrigger value="comments">Comments ({pr.comments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {pr.description}
                  </p>
                </CardContent>
              </Card>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Tests</p>
                    <p className={cn('text-lg font-semibold mt-1', pr.testsFailed > 0 ? 'text-destructive' : 'text-success')}>
                      {pr.testsPassed}/{pr.testsTotal}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Files Changed</p>
                    <p className="text-lg font-semibold mt-1">{pr.filesChanged}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <div className="mt-2">
                      <RiskScoreBar score={pr.riskScore} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="commits" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pr.commits.map((commit) => (
                      <div key={commit.id} className="flex items-start gap-3 p-4">
                        <GitCommit className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{commit.message}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={commit.authorAvatar} alt={commit.author} />
                              <AvatarFallback>{commit.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{commit.author}</span>
                            <span>·</span>
                            <span className="font-mono">{commit.sha}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(commit.timestamp)}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono">
                          <span className="text-success">+{commit.additions}</span>{' '}
                          <span className="text-destructive">-{commit.deletions}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pr.fileChanges.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-4">
                        <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-mono truncate">{file.path}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{file.language}</p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{file.status}</Badge>
                        <span className="text-xs font-mono">
                          <span className="text-success">+{file.additions}</span>{' '}
                          <span className="text-destructive">-{file.deletions}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checks" className="mt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pr.checks.map((check) => (
                  <Card key={check.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      {check.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : check.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Loader2 className="h-5 w-5 text-info animate-spin" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{check.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{check.type} · {check.duration}s</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {pr.comments.length > 0 ? (
                    <div className="divide-y">
                      {pr.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-4">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                            <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{comment.author}</span>
                              <Badge variant="secondary" className="text-[10px] capitalize">{comment.type}</Badge>
                              <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.timestamp)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{comment.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No comments yet" icon={MessageSquare} className="border-0" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar with AI Analysis */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI Analysis
              </CardTitle>
              <CardDescription>
                Get AI-powered code review insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analyze.data && !analyze.isPending && (
                <Button onClick={handleAnalyze} className="w-full gap-2">
                  <Bot className="h-4 w-4" />
                  Analyze with AI
                </Button>
              )}
              {analyze.isPending && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing pull request...</p>
                </div>
              )}
              {analyze.data && (
                <AIAnalysisResult
                  data={analyze.data}
                  onReanalyze={handleAnalyze}
                />
              )}
            </CardContent>
          </Card>

          {/* Author info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Author</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={pr.authorAvatar} alt={pr.author} />
                <AvatarFallback>{pr.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{pr.author}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {formatRelativeTime(pr.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {project && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm text-primary hover:underline"
                >
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

function AIAnalysisResult({
  data,
  onReanalyze,
}: {
  data: NonNullable<ReturnType<typeof useAnalyzePR>['data']>;
  onReanalyze: () => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Risk Score */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-xs text-muted-foreground">Risk Score</p>
          <p className="text-2xl font-bold tabular-nums">{data.riskScore}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <RiskBadge level={data.riskLevel} />
          <span className="text-xs text-muted-foreground">
            {Math.round(data.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
        <p className="text-sm text-muted-foreground">{data.summary}</p>
      </div>

      <Separator />

      {/* Findings */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Findings ({data.findings.length})
        </p>
        <div className="space-y-2">
          {data.findings.map((finding) => {
            const Icon = categoryIcons[finding.category];
            return (
              <div
                key={finding.id}
                className={cn('rounded-md border p-3', severityColors[finding.severity])}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-medium uppercase">{finding.category}</span>
                  <Badge variant="outline" className={cn('ml-auto text-[10px]', severityColors[finding.severity])}>
                    {finding.severity}
                  </Badge>
                </div>
                <p className="text-sm font-medium mt-2">{finding.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{finding.description}</p>
                {finding.file && (
                  <p className="text-xs font-mono text-muted-foreground mt-1.5">
                    {finding.file}
                    {finding.line && `:${finding.line}`}
                  </p>
                )}
                {finding.suggestion && (
                  <div className="mt-2 flex items-start gap-1.5 rounded bg-muted/50 p-2">
                    <Lightbulb className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{finding.suggestion}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Recommendations */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recommendations ({data.recommendations.length})
        </p>
        <div className="space-y-2">
          {data.recommendations.map((rec) => (
            <div key={rec.id} className="flex items-start gap-2 rounded-md border p-2.5">
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  rec.priority === 'high' && 'bg-destructive/10 text-destructive',
                  rec.priority === 'medium' && 'bg-warning/10 text-warning',
                  rec.priority === 'low' && 'bg-success/10 text-success'
                )}
              >
                {rec.priority.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{rec.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onReanalyze} className="w-full">
        <Bot className="h-3.5 w-3.5 mr-1.5" />
        Re-analyze
      </Button>
    </div>
  );
}
