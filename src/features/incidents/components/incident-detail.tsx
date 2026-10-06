'use client';

import { Rocket, Users } from 'lucide-react';
import Link from 'next/link';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncidentStatusBadge, SeverityBadge } from '@/components/status/status-badges';
import { AnalysisPanel } from '@/features/ai/components/analysis-panel';
import { AskAIButton } from '@/features/ai/components/ask-ai-button';
import { useAIAnalysis } from '@/features/ai/hooks/use-ai-analysis';
import { useRegisterAIContext } from '@/features/ai/hooks/use-register-ai-context';
import { useNow } from '@/hooks/use-now';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useIncident } from '../hooks/use-incidents';
import { IncidentAnalysisResult } from './incident-analysis-result';
import { IncidentStatusControl } from './incident-status-control';
import { IncidentTimeline } from './incident-timeline';

export function IncidentDetail({ projectId, incidentId }: { projectId: string; incidentId: string }) {
  const { data: incident } = useIncident(incidentId);
  const ai = useAIAnalysis({ kind: 'incident', projectId, key: incidentId });
  useRegisterAIContext({ type: 'incident', id: incidentId, label: incidentId.toUpperCase() });
  const now = useNow();
  if (!incident) return null;
  const deploymentNumber = incident.relatedDeploymentId?.split('~')[1];
  const durationMinutes = Math.round(((incident.resolvedAt ? new Date(incident.resolvedAt).getTime() : now || new Date(incident.createdAt).getTime()) - new Date(incident.createdAt).getTime()) / 60_000);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <IncidentStatusBadge status={incident.status} />
            <span className="font-mono text-xs text-muted-foreground">{incident.reference}</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{incident.title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{incident.description}</p>
        </div>
        <AskAIButton prompt="Which deployment caused the latest incident?">Ask AI</AskAIButton>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Service', value: <span className="font-mono">{incident.service}</span> },
          { label: 'Affected users', value: formatNumber(incident.affectedUsers) },
          { label: incident.resolvedAt ? 'Time to resolve' : 'Open for', value: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m` },
          { label: 'Opened', value: <RelativeTime value={incident.createdAt} /> },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-3">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 text-sm font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>

      <AnalysisPanel
        title="AI incident investigation"
        description="Correlates the timeline with deployments, logs and code changes."
        ctaLabel="Investigate with AI"
        steps={['Reading the incident timeline', 'Correlating recent deployments', 'Scanning deploy logs for errors', 'Tracing the change back to its PR']}
        analysis={ai.analysis}
        isLoadingPrevious={ai.isLoadingPrevious}
        isAnalyzing={ai.isAnalyzing}
        error={ai.error}
        onAnalyze={ai.analyze}
      >
        {(result) => <IncidentAnalysisResult result={result} />}
      </AnalysisPanel>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <IncidentTimeline events={incident.timeline} startedAt={incident.createdAt} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-muted-foreground" aria-hidden />
                {incident.assignee ? (
                  <span className="flex items-center gap-1.5">
                    <UserAvatar name={incident.assignee} size="xs" /> {incident.assignee}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
              <IncidentStatusControl incident={incident} />
            </CardContent>
          </Card>
          {deploymentNumber && (
            <Card>
              <CardHeader>
                <CardTitle>Related deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/projects/${projectId}/deployments/${deploymentNumber}`} className="flex items-center gap-2 rounded-md border p-2.5 text-sm hover:border-primary/40">
                  <Rocket className="size-4 text-muted-foreground" aria-hidden />
                  Deployment #{deploymentNumber}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(incident.timeline.find((e) => e.type === 'deployment')?.occurredAt, 'HH:mm')}</span>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
