/**
 * Domain model shared by the server (repositories, route handlers) and the
 * client (hooks, components). Everything here is plain serialisable data so
 * it can cross the Server → Client boundary and the JSON API unchanged.
 */

export type ISODateString = string;

export const ROLES = ['ADMIN', 'MANAGER', 'DEVELOPER'] as const;
export type Role = (typeof ROLES)[number];

export type Presence = 'online' | 'away' | 'offline';
export type MemberStatus = 'active' | 'invited';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
}

export interface TeamMember extends User {
  status: MemberStatus;
  presence: Presence;
  lastActiveAt: ISODateString;
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export const PROJECT_STATUSES = ['active', 'paused', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const DEPLOYMENT_STATUSES = ['success', 'failed', 'in_progress', 'queued', 'cancelled'] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const ENVIRONMENTS = ['production', 'staging', 'preview'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  repository: string;
  defaultBranch: string;
  status: ProjectStatus;
  deploymentStatus: DeploymentStatus;
  openPullRequests: number;
  activeIncidents: number;
  healthScore: number;
  lastDeploymentAt: ISODateString | null;
  language: string;
  tags: string[];
  ownerId: string;
  createdAt: ISODateString;
}

/* -------------------------------------------------------------------------- */
/* Pull requests                                                              */
/* -------------------------------------------------------------------------- */

export const PR_STATUSES = ['open', 'draft', 'merged', 'closed'] as const;
export type PullRequestStatus = (typeof PR_STATUSES)[number];

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type ReviewStatus = 'pending' | 'approved' | 'changes_requested' | 'commented';
export type CheckStatus = 'success' | 'failed' | 'running' | 'skipped';

export interface Commit {
  sha: string;
  message: string;
  author: string;
  committedAt: ISODateString;
  additions: number;
  deletions: number;
}

export type DiffLineKind = 'context' | 'add' | 'remove';

export interface DiffLine {
  kind: DiffLineKind;
  content: string;
  oldNumber: number | null;
  newNumber: number | null;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export type FileChangeStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export interface FileChange {
  path: string;
  status: FileChangeStatus;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface CheckRun {
  id: string;
  name: string;
  status: CheckStatus;
  durationSeconds: number;
  summary: string;
}

export interface ReviewComment {
  id: string;
  author: string;
  body: string;
  createdAt: ISODateString;
  kind: 'comment' | 'approval' | 'changes_requested';
  path?: string;
  line?: number;
}

export interface TestSummary {
  passed: number;
  failed: number;
  skipped: number;
}

export interface PullRequestSummary {
  id: string;
  projectId: string;
  number: number;
  title: string;
  author: string;
  status: PullRequestStatus;
  reviewStatus: ReviewStatus;
  branch: string;
  baseBranch: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  tests: TestSummary;
  riskScore: number;
  riskLevel: RiskLevel;
  labels: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PullRequest extends PullRequestSummary {
  description: string;
  reviewers: string[];
  commits: Commit[];
  files: FileChange[];
  checks: CheckRun[];
  comments: ReviewComment[];
}

/* -------------------------------------------------------------------------- */
/* Deployments                                                                */
/* -------------------------------------------------------------------------- */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: ISODateString;
  level: LogLevel;
  source: string;
  message: string;
}

export type StageStatus = 'success' | 'failed' | 'running' | 'pending' | 'skipped';

export interface DeploymentStage {
  id: string;
  name: string;
  status: StageStatus;
  startedAt: ISODateString | null;
  durationSeconds: number;
}

export interface PerformanceSnapshot {
  p50LatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  throughputRps: number;
  cpuPercent: number;
  memoryMb: number;
}

export interface PerformancePoint {
  /** Minutes relative to the deployment start (negative = before). */
  minute: number;
  p95LatencyMs: number;
  errorRate: number;
}

export interface DeploymentSummary {
  id: string;
  projectId: string;
  number: number;
  status: DeploymentStatus;
  environment: Environment;
  commitSha: string;
  commitMessage: string;
  branch: string;
  author: string;
  durationSeconds: number;
  startedAt: ISODateString;
  finishedAt: ISODateString | null;
  pullRequestId: string | null;
  tests: TestSummary;
}

export interface Deployment extends DeploymentSummary {
  url: string | null;
  stages: DeploymentStage[];
  logs: LogEntry[];
  changedFiles: Pick<FileChange, 'path' | 'status' | 'additions' | 'deletions'>[];
  performance: {
    before: PerformanceSnapshot;
    after: PerformanceSnapshot | null;
    series: PerformancePoint[];
  };
}

/* -------------------------------------------------------------------------- */
/* Incidents                                                                  */
/* -------------------------------------------------------------------------- */

export const INCIDENT_SEVERITIES = ['sev1', 'sev2', 'sev3', 'sev4'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const TIMELINE_EVENT_TYPES = [
  'deployment',
  'error',
  'latency',
  'created',
  'investigation',
  'mitigation',
  'resolution',
  'note',
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  occurredAt: ISODateString;
  actor: string | null;
  /** Optional deep link (e.g. the deployment that triggered the incident). */
  href?: string;
  metadata?: Record<string, string>;
}

export interface IncidentSummary {
  id: string;
  projectId: string;
  reference: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  service: string;
  assignee: string | null;
  affectedUsers: number;
  createdAt: ISODateString;
  resolvedAt: ISODateString | null;
}

export interface Incident extends IncidentSummary {
  description: string;
  relatedDeploymentId: string | null;
  timeline: TimelineEvent[];
}

/* -------------------------------------------------------------------------- */
/* Dashboard / metrics                                                        */
/* -------------------------------------------------------------------------- */

export const DATE_RANGES = ['24h', '7d', '30d', '90d'] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export interface MetricValue {
  value: number;
  /** Change vs. the previous period of the same length. */
  delta: number;
  /** Small series used for sparklines. */
  sparkline: number[];
}

export interface DashboardMetrics {
  range: DateRange;
  activeProjects: MetricValue;
  openPullRequests: MetricValue;
  deployments: MetricValue;
  activeIncidents: MetricValue;
  deploymentSuccessRate: MetricValue;
  errorRate: MetricValue;
  engineeringHealth: MetricValue;
}

export interface DeploymentSeriesPoint {
  bucket: ISODateString;
  success: number;
  failed: number;
}

export interface PerformanceSeriesPoint {
  bucket: ISODateString;
  p95LatencyMs: number;
  errorRate: number;
}

export interface ActivityItem {
  id: string;
  kind: 'pull_request' | 'deployment' | 'incident' | 'project' | 'team';
  title: string;
  description: string;
  actor: string;
  occurredAt: ISODateString;
  projectId: string | null;
  href: string | null;
}

/* -------------------------------------------------------------------------- */
/* Cross-cutting                                                              */
/* -------------------------------------------------------------------------- */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export type SearchResultType = 'project' | 'pull_request' | 'deployment' | 'incident' | 'member';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface Notification {
  id: string;
  kind: 'incident' | 'deployment' | 'review' | 'mention';
  title: string;
  body: string;
  href: string;
  createdAt: ISODateString;
  read: boolean;
  /** Set for incident notifications; used by the minimum-severity preference. */
  severity?: IncidentSeverity | null;
}
