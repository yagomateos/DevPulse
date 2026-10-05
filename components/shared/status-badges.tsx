'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type {
  DeploymentStatus,
  PRStatus,
  RiskLevel,
  IncidentStatus,
  IncidentSeverity,
  ProjectStatus,
} from '@/types';

const deploymentStatusConfig: Record<
  DeploymentStatus,
  { label: string; className: string; dot: string }
> = {
  success: {
    label: 'Success',
    className: 'border-success/30 bg-success/10 text-success',
    dot: 'bg-success',
  },
  failed: {
    label: 'Failed',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
  },
  in_progress: {
    label: 'In Progress',
    className: 'border-info/30 bg-info/10 text-info',
    dot: 'bg-info animate-pulse',
  },
  pending: {
    label: 'Pending',
    className: 'border-warning/30 bg-warning/10 text-warning',
    dot: 'bg-warning',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

export function DeploymentStatusBadge({
  status,
  showDot = true,
}: {
  status: DeploymentStatus;
  showDot?: boolean;
}) {
  const config = deploymentStatusConfig[status];
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', config.className)}>
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />}
      {config.label}
    </Badge>
  );
}

const prStatusConfig: Record<PRStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'border-success/30 bg-success/10 text-success',
  },
  merged: {
    label: 'Merged',
    className: 'border-primary/30 bg-primary/10 text-primary',
  },
  closed: {
    label: 'Closed',
    className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  },
  draft: {
    label: 'Draft',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
};

export function PRStatusBadge({ status }: { status: PRStatus }) {
  const config = prStatusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}

const riskLevelConfig: Record<
  RiskLevel,
  { label: string; className: string }
> = {
  low: {
    label: 'Low',
    className: 'border-success/30 bg-success/10 text-success',
  },
  medium: {
    label: 'Medium',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  high: {
    label: 'High',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  critical: {
    label: 'Critical',
    className:
      'border-destructive/40 bg-destructive/20 text-destructive',
  },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = riskLevelConfig[level];
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}

export function RiskScoreBar({ score }: { score: number }) {
  const color =
    score < 30
      ? 'bg-success'
      : score < 60
        ? 'bg-warning'
        : score < 80
          ? 'bg-destructive/80'
          : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums">{score}</span>
    </div>
  );
}

const incidentStatusConfig: Record<
  IncidentStatus,
  { label: string; className: string; dot: string }
> = {
  investigating: {
    label: 'Investigating',
    className: 'border-warning/30 bg-warning/10 text-warning',
    dot: 'bg-warning animate-pulse',
  },
  identified: {
    label: 'Identified',
    className: 'border-info/30 bg-info/10 text-info',
    dot: 'bg-info',
  },
  monitoring: {
    label: 'Monitoring',
    className: 'border-primary/30 bg-primary/10 text-primary',
    dot: 'bg-primary',
  },
  resolved: {
    label: 'Resolved',
    className: 'border-success/30 bg-success/10 text-success',
    dot: 'bg-success',
  },
};

export function IncidentStatusBadge({
  status,
  showDot = true,
}: {
  status: IncidentStatus;
  showDot?: boolean;
}) {
  const config = incidentStatusConfig[status];
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', config.className)}>
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />}
      {config.label}
    </Badge>
  );
}

const severityConfig: Record<
  IncidentSeverity,
  { label: string; className: string }
> = {
  low: {
    label: 'Low',
    className: 'border-success/30 bg-success/10 text-success',
  },
  medium: {
    label: 'Medium',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  high: {
    label: 'High',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  critical: {
    label: 'Critical',
    className: 'border-destructive/40 bg-destructive/20 text-destructive',
  },
};

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const config = severityConfig[severity];
  return (
    <Badge variant="outline" className={cn('font-medium uppercase', config.className)}>
      {config.label}
    </Badge>
  );
}

const projectStatusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'border-success/30 bg-success/10 text-success',
  },
  archived: {
    label: 'Archived',
    className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  },
  paused: {
    label: 'Paused',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = projectStatusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}

export function HealthScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85
      ? 'border-success/30 bg-success/10 text-success'
      : score >= 70
        ? 'border-warning/30 bg-warning/10 text-warning'
        : 'border-destructive/30 bg-destructive/10 text-destructive';
  return (
    <Badge variant="outline" className={cn('font-medium tabular-nums', color)}>
      {score}/100
    </Badge>
  );
}
