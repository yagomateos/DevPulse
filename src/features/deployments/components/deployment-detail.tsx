'use client';

import { ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnvironmentBadge } from '@/components/status/status-badges';
import { AnalysisPanel } from '@/features/ai/components/analysis-panel';
import { AskAIButton } from '@/features/ai/components/ask-ai-button';
import { useAIAnalysis } from '@/features/ai/hooks/use-ai-analysis';
import { useRegisterAIContext } from '@/features/ai/hooks/use-register-ai-context';
import { useUrlState } from '@/hooks/use-url-state';
import { formatDuration } from '@/lib/format';
import { useDeployment } from '../hooks/use-deployments';
import { CommitInfo } from './commit-info';
import { DeploymentAnalysisResult } from './deployment-analysis-result';
import { DeploymentLogs } from './deployment-logs';
import { DeploymentMetrics } from './deployment-metrics';
import { DeploymentStatus } from './deployment-status';
import { DeploymentTimeline } from './deployment-timeline';
import { PerformanceComparison } from './performance-comparison';
import { useDateFormatter } from '@/features/settings/components/workspace-preferences-provider';

const PerformanceSeriesChart = dynamic(() => import('./performance-series-chart'), { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> });

const TABS = ['overview', 'logs', 'changes', 'performance'] as const;
type Tab = (typeof TABS)[number];

export function DeploymentDetail({ projectId, number }: { projectId: string; number: number }) {
  const formatDate = useDateFormatter();
  const { data: d } = useDeployment(projectId, number);
  const url = useUrlState();
  const tabParam = url.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'overview';
  const ai = useAIAnalysis({ kind: 'deployment', projectId, key: String(number) });
  useRegisterAIContext({ type: 'deployment', id: `${projectId}~${number}`, label: `Deployment #${number}` });
  if (!d) return null;
  const errorCount = d.logs.filter((l) => l.level === 'error').length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <DeploymentStatus status={d.status} />
            <EnvironmentBadge environment={d.environment} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Deployment #{d.number}</h1>
          <p className="text-xs text-muted-foreground">
            {formatDate(d.startedAt, 'long')} · {d.finishedAt ? `finished in ${formatDuration(d.durationSeconds)}` : 'in progress — updating live'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AskAIButton prompt="Explain this deployment and whether it caused any incident">Ask AI</AskAIButton>
          {d.url && (
            <Button asChild size="sm" variant="outline">
              <a href={d.url} target="_blank" rel="noreferrer">
                Visit <ExternalLink />
              </a>
            </Button>
          )}
        </div>
      </header>

      <DeploymentMetrics deployment={d} />

      <AnalysisPanel
        title="AI deployment analysis"
        description="Correlates pipeline stages, logs, tests, changes and metrics."
        ctaLabel="Analyze Deployment"
        steps={['Reading pipeline and logs', 'Comparing performance before and after', 'Inspecting changed files', 'Ranking likely causes']}
        analysis={ai.analysis}
        isLoadingPrevious={ai.isLoadingPrevious}
        isAnalyzing={ai.isAnalyzing}
        error={ai.error}
        onAnalyze={ai.analyze}
      >
        {(result) => <DeploymentAnalysisResult result={result} />}
      </AnalysisPanel>

      <Tabs value={tab} onValueChange={(v) => url.set({ tab: v === 'overview' ? null : v })}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            Logs {errorCount > 0 && <span className="rounded bg-destructive/15 px-1 text-[10px] text-destructive">{errorCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <DeploymentTimeline stages={d.stages} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Commit</CardTitle>
            </CardHeader>
            <CardContent>
              <CommitInfo deployment={d} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <DeploymentLogs logs={d.logs} />
        </TabsContent>
        <TabsContent value="changes" className="mt-4">
          {d.changedFiles.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No file-level changes recorded for this deployment.</p>
          ) : (
            <Card>
              <ul className="divide-y">
                {d.changedFiles.map((f) => (
                  <li key={f.path} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-16 text-[11px] uppercase text-muted-foreground">{f.status}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">{f.path}</span>
                    <span className="font-mono text-xs">
                      <span className="text-success">+{f.additions}</span> <span className="text-destructive">−{f.deletions}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {d.pullRequestId && (
                <div className="border-t px-4 py-3 text-xs">
                  <Link href={`/projects/${d.projectId}/pull-requests/${d.pullRequestId.split('#')[1]}?tab=files`} className="text-primary hover:underline">
                    View full diff in pull request #{d.pullRequestId.split('#')[1]} →
                  </Link>
                </div>
              )}
            </Card>
          )}
        </TabsContent>
        <TabsContent value="performance" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Latency and errors around the release</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceSeriesChart series={d.performance.series} />
            </CardContent>
          </Card>
          <PerformanceComparison before={d.performance.before} after={d.performance.after} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
