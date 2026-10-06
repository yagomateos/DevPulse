import {
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  GitPullRequestDraft,
  Loader2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  CheckStatus,
  DeploymentStatus,
  Environment,
  IncidentSeverity,
  IncidentStatus,
  ProjectStatus,
  PullRequestStatus,
  ReviewStatus,
  RiskLevel,
  StageStatus,
} from '@/types/domain';

type Tone = NonNullable<BadgeProps['variant']>;
interface Config {
  label: string;
  tone: Tone;
  icon?: LucideIcon;
  spin?: boolean;
}

function StatusBadge({ config, className }: { config: Config; className?: string }) {
  const Icon = config.icon;
  return (
    <Badge variant={config.tone} className={className}>
      {Icon && <Icon className={cn('size-3', config.spin && 'animate-spin')} aria-hidden />}
      {config.label}
    </Badge>
  );
}

export const DEPLOYMENT_STATUS: Record<DeploymentStatus, Config> = {
  success: { label: 'Ready', tone: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', tone: 'destructive', icon: XCircle },
  in_progress: { label: 'Building', tone: 'info', icon: Loader2, spin: true },
  queued: { label: 'Queued', tone: 'muted', icon: Clock },
  cancelled: { label: 'Cancelled', tone: 'muted', icon: CircleDashed },
};

export const PR_STATUS: Record<PullRequestStatus, Config> = {
  open: { label: 'Open', tone: 'success', icon: GitPullRequest },
  draft: { label: 'Draft', tone: 'muted', icon: GitPullRequestDraft },
  merged: { label: 'Merged', tone: 'default', icon: GitMerge },
  closed: { label: 'Closed', tone: 'destructive', icon: GitPullRequestClosed },
};

export const RISK: Record<RiskLevel, Config> = {
  low: { label: 'Low', tone: 'success' },
  medium: { label: 'Medium', tone: 'warning' },
  high: { label: 'High', tone: 'destructive' },
  critical: { label: 'Critical', tone: 'destructive' },
};

export const SEVERITY: Record<IncidentSeverity, Config & { description: string }> = {
  sev1: { label: 'SEV1', tone: 'destructive', description: 'Critical — full outage or data loss' },
  sev2: { label: 'SEV2', tone: 'warning', description: 'Major — significant degradation' },
  sev3: { label: 'SEV3', tone: 'info', description: 'Minor — partial impact' },
  sev4: { label: 'SEV4', tone: 'muted', description: 'Low — cosmetic or internal' },
};

export const INCIDENT_STATUS: Record<IncidentStatus, Config> = {
  investigating: { label: 'Investigating', tone: 'destructive', icon: CircleDot },
  identified: { label: 'Identified', tone: 'warning', icon: CircleDot },
  monitoring: { label: 'Monitoring', tone: 'info', icon: CircleDot },
  resolved: { label: 'Resolved', tone: 'success', icon: CheckCircle2 },
};

export const PROJECT_STATUS: Record<ProjectStatus, Config> = {
  active: { label: 'Active', tone: 'success' },
  paused: { label: 'Paused', tone: 'warning' },
  archived: { label: 'Archived', tone: 'muted' },
};

export const ENVIRONMENT: Record<Environment, Config> = {
  production: { label: 'Production', tone: 'default' },
  staging: { label: 'Staging', tone: 'secondary' },
  preview: { label: 'Preview', tone: 'outline' },
};

export const REVIEW_STATUS: Record<ReviewStatus, Config> = {
  pending: { label: 'Review pending', tone: 'muted', icon: Clock },
  approved: { label: 'Approved', tone: 'success', icon: CheckCircle2 },
  changes_requested: { label: 'Changes requested', tone: 'destructive', icon: XCircle },
  commented: { label: 'Commented', tone: 'info', icon: CircleDot },
};

export const CHECK_STATUS: Record<CheckStatus | StageStatus, Config> = {
  success: { label: 'Passed', tone: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', tone: 'destructive', icon: XCircle },
  running: { label: 'Running', tone: 'info', icon: Loader2, spin: true },
  pending: { label: 'Pending', tone: 'muted', icon: Clock },
  skipped: { label: 'Skipped', tone: 'muted', icon: CircleDashed },
};

export const DeploymentStatusBadge = ({ status, className }: { status: DeploymentStatus; className?: string }) => <StatusBadge config={DEPLOYMENT_STATUS[status]} className={className} />;
export const PRStatusBadge = ({ status, className }: { status: PullRequestStatus; className?: string }) => <StatusBadge config={PR_STATUS[status]} className={className} />;
export const RiskBadge = ({ level, score, className }: { level: RiskLevel; score?: number; className?: string }) => (
  <StatusBadge config={{ ...RISK[level], label: score !== undefined ? `${RISK[level].label} · ${score}` : RISK[level].label }} className={cn(level === 'critical' && 'font-semibold', className)} />
);
export const SeverityBadge = ({ severity, className }: { severity: IncidentSeverity; className?: string }) => (
  <span title={SEVERITY[severity].description}>
    <StatusBadge config={SEVERITY[severity]} className={cn('font-mono', className)} />
  </span>
);
export const IncidentStatusBadge = ({ status, className }: { status: IncidentStatus; className?: string }) => <StatusBadge config={INCIDENT_STATUS[status]} className={className} />;
export const ProjectStatusBadge = ({ status, className }: { status: ProjectStatus; className?: string }) => <StatusBadge config={PROJECT_STATUS[status]} className={className} />;
export const EnvironmentBadge = ({ environment, className }: { environment: Environment; className?: string }) => <StatusBadge config={ENVIRONMENT[environment]} className={className} />;
export const ReviewStatusBadge = ({ status, className }: { status: ReviewStatus; className?: string }) => <StatusBadge config={REVIEW_STATUS[status]} className={className} />;
export const CheckStatusBadge = ({ status, className }: { status: CheckStatus | StageStatus; className?: string }) => <StatusBadge config={CHECK_STATUS[status]} className={className} />;

export function CheckStatusIcon({ status, className }: { status: CheckStatus | StageStatus; className?: string }) {
  const config = CHECK_STATUS[status];
  const Icon = config.icon ?? CircleDot;
  const color = { success: 'text-success', destructive: 'text-destructive', info: 'text-info', muted: 'text-muted-foreground' }[config.tone as string] ?? 'text-muted-foreground';
  return <Icon className={cn('size-4 shrink-0', color, config.spin && 'animate-spin', className)} aria-label={config.label} />;
}
