'use client';

import { ArrowRight, FileCode2, GitBranch, GitCommit, ListChecks, MessageSquare, Rocket } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import { DeploymentStatusBadge, EnvironmentBadge, PRStatusBadge, ReviewStatusBadge, RiskBadge } from '@/components/status/status-badges';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisPanel } from '@/features/ai/components/analysis-panel';
import { AskAIButton } from '@/features/ai/components/ask-ai-button';
import { useAIAnalysis } from '@/features/ai/hooks/use-ai-analysis';
import { useRegisterAIContext } from '@/features/ai/hooks/use-register-ai-context';
import { useDeployments } from '@/features/deployments/hooks/use-deployments';
import { useUrlState } from '@/hooks/use-url-state';
import { usePullRequest } from '../hooks/use-pull-requests';
import { ChecksList, CommentThread, CommitList } from './pr-activity';
import { CodeChange, fileAnchor } from './review/code-change';
import { PRAnalysisResult } from './review/pr-analysis-result';

const Markdown = dynamic(() => import('@/features/ai/components/ai-response'), { loading: () => <Skeleton className="h-16 w-full" /> });

const TABS = ['conversation', 'commits', 'files', 'checks'] as const;
type Tab = (typeof TABS)[number];

export function PullRequestDetail({ projectId, number }: { projectId: string; number: number }) {
  const { data: pr } = usePullRequest(projectId, number);
  const url = useUrlState();
  const tabParam = url.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'conversation';
  const [focus, setFocus] = useState<{ file: string; line: number | null } | null>(null);
  const ai = useAIAnalysis({ kind: 'pull_request', projectId, key: String(number) });
  const deployments = useDeployments({ projectId, pageSize: 50 });
  useRegisterAIContext({ type: 'pull_request', id: `${projectId}#${number}`, label: `PR #${number}` });

  if (!pr) return null;
  const findings = ai.analysis?.result.findings ?? [];
  const linkedDeployments = deployments.data?.items.filter((d) => d.pullRequestId === pr.id) ?? [];

  const locate = (file: string, line: number | null) => {
    setFocus({ file, line });
    url.set({ tab: 'files' });
    // Wait for the files tab to render before scrolling.
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(fileAnchor(file))?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <PRStatusBadge status={pr.status} />
          <ReviewStatusBadge status={pr.reviewStatus} />
          {pr.labels.map((l) => (
            <Badge key={l} variant="outline">
              {l}
            </Badge>
          ))}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-balance">
            {pr.title} <span className="font-normal text-muted-foreground">#{pr.number}</span>
          </h1>
          <AskAIButton prompt="Summarize this pull request and its risks">Ask AI about this PR</AskAIButton>
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <UserAvatar name={pr.author} size="xs" />
          <span className="font-medium text-foreground">{pr.author}</span> wants to merge {pr.commits.length} commits into
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{pr.baseBranch}</code> from
          <code className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono">
            <GitBranch className="size-3" aria-hidden />
            {pr.branch}
          </code>
          · updated <RelativeTime value={pr.updatedAt} />
        </p>
      </header>

      <AnalysisPanel
        title="AI code review"
        description="Structured review of the diff, checks, commits and comments."
        ctaLabel="Analyze with AI"
        steps={['Reading the diff', 'Checking tests and CI results', 'Cross-referencing review comments', 'Scoring risk']}
        analysis={ai.analysis}
        isLoadingPrevious={ai.isLoadingPrevious}
        isAnalyzing={ai.isAnalyzing}
        error={ai.error}
        onAnalyze={ai.analyze}
      >
        {(result) => <PRAnalysisResult result={result} onLocate={locate} />}
      </AnalysisPanel>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Tabs value={tab} onValueChange={(v) => url.set({ tab: v === 'conversation' ? null : v })} className="min-w-0">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="conversation" className="gap-1.5">
              <MessageSquare className="size-3.5" aria-hidden /> Conversation <span className="text-muted-foreground">{pr.comments.length}</span>
            </TabsTrigger>
            <TabsTrigger value="commits" className="gap-1.5">
              <GitCommit className="size-3.5" aria-hidden /> Commits <span className="text-muted-foreground">{pr.commits.length}</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <FileCode2 className="size-3.5" aria-hidden /> Files <span className="text-muted-foreground">{pr.files.length}</span>
            </TabsTrigger>
            <TabsTrigger value="checks" className="gap-1.5">
              <ListChecks className="size-3.5" aria-hidden /> Checks
            </TabsTrigger>
          </TabsList>
          <TabsContent value="conversation" className="mt-4 space-y-6">
            <Card className="p-4">
              <Markdown content={pr.description} />
            </Card>
            <CommentThread comments={pr.comments} />
          </TabsContent>
          <TabsContent value="commits" className="mt-4">
            <CommitList commits={pr.commits} />
          </TabsContent>
          <TabsContent value="files" className="mt-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              {pr.files.length} files · <span className="text-success">+{pr.additions}</span> <span className="text-destructive">−{pr.deletions}</span>
              {findings.length > 0 && ` · ${findings.filter((f) => f.file).length} AI annotations inline`}
            </p>
            {pr.files.map((file) => (
              <CodeChange
                key={file.path}
                file={file}
                findings={findings.filter((f) => f.file === file.path)}
                comments={pr.comments.filter((c) => c.path === file.path)}
                focusLine={focus?.file === file.path ? focus.line : null}
              />
            ))}
          </TabsContent>
          <TabsContent value="checks" className="mt-4">
            <ChecksList checks={pr.checks} />
          </TabsContent>
        </Tabs>

        <aside className="space-y-5 text-sm" aria-label="Pull request details">
          <section>
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Risk</h2>
            <RiskBadge level={ai.analysis?.result.riskLevel ?? pr.riskLevel} score={ai.analysis?.result.riskScore ?? pr.riskScore} />
            <p className="mt-1 text-xs text-muted-foreground">{ai.analysis ? 'From latest AI review' : 'Baseline estimate — run the AI review for details'}</p>
          </section>
          <section>
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Tests</h2>
            <p className="text-xs">
              <span className="text-success">{pr.tests.passed} passed</span> · <span className={pr.tests.failed ? 'text-destructive' : 'text-muted-foreground'}>{pr.tests.failed} failed</span> · <span className="text-muted-foreground">{pr.tests.skipped} skipped</span>
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reviewers</h2>
            <ul className="space-y-1.5">
              {pr.reviewers.map((r) => (
                <li key={r} className="flex items-center gap-2 text-xs">
                  <UserAvatar name={r} size="xs" /> {r}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Deployments</h2>
            {linkedDeployments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Not deployed yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {linkedDeployments.map((d) => (
                  <li key={d.id}>
                    <Link href={`/projects/${d.projectId}/deployments/${d.number}`} className="group flex items-center gap-2 rounded-md border p-2 text-xs hover:border-primary/40">
                      <Rocket className="size-3.5 text-muted-foreground" aria-hidden />
                      <span className="font-mono">#{d.number}</span>
                      <EnvironmentBadge environment={d.environment} />
                      <DeploymentStatusBadge status={d.status} className="ml-auto" />
                      <ArrowRight className="size-3 text-muted-foreground group-hover:text-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
