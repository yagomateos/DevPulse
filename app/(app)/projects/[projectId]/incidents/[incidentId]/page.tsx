'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useIncident, useInvestigateIncident } from '@/hooks/use-incidents';
import { useProject } from '@/hooks/use-projects';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import {
  IncidentStatusBadge,
  SeverityBadge,
} from '@/components/shared/status-badges';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IncidentTimeline } from '@/components/incidents/incident-timeline';
import { formatRelativeTime, formatDateTime, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Bot,
  Loader2,
  Users,
  Clock,
  Server,
  AlertCircle,
  Gauge,
  Activity,
} from 'lucide-react';

export default function IncidentDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const incidentId = params.incidentId as string;
  const { data: project } = useProject(projectId);
  const { data: incident, isLoading, isError, refetch } = useIncident(incidentId);
  const investigate = useInvestigateIncident();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !incident) {
    return <ErrorState title="Incident not found" onRetry={refetch} />;
  }

  const handleInvestigate = () => {
    investigate.mutate(incidentId);
  };

  return (
    <div className="space-y-6">
      <Link href={`/projects/${projectId}/incidents`}>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <IncidentStatusBadge status={incident.status} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{incident.title}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">{incident.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Affected Users
            </div>
            <p className="text-lg font-semibold mt-1 tabular-nums">
              {incident.affectedUsers.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Duration
            </div>
            <p className="text-lg font-semibold mt-1">{formatDuration(incident.duration)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Server className="h-3.5 w-3.5" />
              Service
            </div>
            <p className="text-sm font-medium mt-1 font-mono">{incident.service}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Created
            </div>
            <p className="text-sm font-medium mt-1">{formatRelativeTime(incident.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incident Timeline</CardTitle>
              <CardDescription>Chronological events during the incident</CardDescription>
            </CardHeader>
            <CardContent>
              <IncidentTimeline events={incident.timeline} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AI Investigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI Investigation
              </CardTitle>
              <CardDescription>AI-powered incident analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {!investigate.data && !investigate.isPending && (
                <Button onClick={handleInvestigate} className="w-full gap-2">
                  <Bot className="h-4 w-4" />
                  Investigate with AI
                </Button>
              )}
              {investigate.isPending && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Investigating incident...</p>
                </div>
              )}
              {investigate.data && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
                    <p className="text-sm text-muted-foreground">{investigate.data.summary}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Likely Cause</p>
                    <p className="text-sm text-muted-foreground">{investigate.data.likelyCause}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence</p>
                    <ul className="space-y-1.5">
                      {investigate.data.evidence.map((ev, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Affected Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {investigate.data.affectedServices.map((svc) => (
                        <Badge key={svc} variant="secondary" className="text-xs">
                          {svc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommendations</p>
                    <ul className="space-y-1.5">
                      {investigate.data.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <Gauge className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Confidence: {Math.round(investigate.data.confidence * 100)}%
                  </p>
                  <Button variant="outline" size="sm" onClick={handleInvestigate} className="w-full">
                    Re-investigate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignee</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={incident.assigneeAvatar} alt={incident.assignee} />
                <AvatarFallback>{incident.assignee.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{incident.assignee}</p>
                <p className="text-xs text-muted-foreground">Incident Commander</p>
              </div>
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
