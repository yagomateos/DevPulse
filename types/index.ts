export type Role = 'ADMIN' | 'MANAGER' | 'DEVELOPER';

export type ProjectStatus = 'active' | 'archived' | 'paused';
export type DeploymentStatus =
  | 'success'
  | 'failed'
  | 'in_progress'
  | 'pending'
  | 'cancelled';
export type DeploymentEnvironment = 'production' | 'staging' | 'preview';
export type PRStatus = 'open' | 'merged' | 'closed' | 'draft';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus =
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
  status: 'online' | 'away' | 'offline';
  lastActive: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  repository: string;
  branch: string;
  status: ProjectStatus;
  deploymentStatus: DeploymentStatus;
  openPRs: number;
  incidents: number;
  healthScore: number;
  lastDeployment: string;
  contributors: number;
  stars: number;
  language: string;
  tags: string[];
  createdAt: string;
}

export interface Commit {
  id: string;
  sha: string;
  message: string;
  author: string;
  authorAvatar: string;
  timestamp: string;
  additions: number;
  deletions: number;
}

export interface FileChange {
  id: string;
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  language: string;
}

export interface Check {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  duration: number;
  type: 'test' | 'lint' | 'build' | 'security' | 'deploy';
}

export interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  body: string;
  timestamp: string;
  type: 'comment' | 'review' | 'approval' | 'change_request';
}

export interface PullRequest {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  author: string;
  authorAvatar: string;
  status: PRStatus;
  branch: string;
  baseBranch: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  testsPassed: number;
  testsFailed: number;
  testsTotal: number;
  riskScore: number;
  riskLevel: RiskLevel;
  commits: Commit[];
  fileChanges: FileChange[];
  checks: Check[];
  comments: Comment[];
  reviewStatus: 'pending' | 'approved' | 'changes_requested' | 'reviewed';
  updatedAt: string;
  createdAt: string;
  labels: string[];
}

export interface DeploymentLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface DeploymentMetric {
  label: string;
  value: number;
  unit: string;
  change: number;
  previousValue: number;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  environment: DeploymentEnvironment;
  commitSha: string;
  commitMessage: string;
  branch: string;
  author: string;
  authorAvatar: string;
  duration: number;
  startTime: string;
  endTime: string | null;
  url: string;
  logs: DeploymentLogEntry[];
  metrics: DeploymentMetric[];
  testsPassed: number;
  testsTotal: number;
}

export interface IncidentTimelineEvent {
  id: string;
  type:
    | 'deployment'
    | 'error'
    | 'latency'
    | 'created'
    | 'investigation'
    | 'mitigation'
    | 'resolution'
    | 'comment';
  title: string;
  description: string;
  timestamp: string;
  author?: string;
  authorAvatar?: string;
}

export interface Incident {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  service: string;
  assignee: string;
  assigneeAvatar: string;
  createdAt: string;
  resolvedAt: string | null;
  affectedUsers: number;
  duration: number;
  timeline: IncidentTimelineEvent[];
  tags: string[];
}

export interface AIFinding {
  id: string;
  category:
    | 'Security'
    | 'Performance'
    | 'Accessibility'
    | 'Type Safety'
    | 'Testing'
    | 'Maintainability';
  severity: RiskLevel;
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface AIRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

export interface AIPRAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  findings: AIFinding[];
  recommendations: AIRecommendation[];
  confidence: number;
}

export interface AIDeploymentAnalysis {
  risk: RiskLevel;
  possibleCause: string;
  evidence: string[];
  affectedAreas: string[];
  recommendedActions: string[];
  confidence: number;
}

export interface AIIncidentAnalysis {
  summary: string;
  likelyCause: string;
  evidence: string[];
  affectedServices: string[];
  recommendations: string[];
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: { type: string; label: string; href: string }[];
  isStreaming?: boolean;
}

export interface DashboardMetrics {
  activeProjects: number;
  openPRs: number;
  recentDeployments: number;
  activeIncidents: number;
  deploymentSuccessRate: number;
  errorRate: number;
  engineeringHealth: number;
  trends: {
    activeProjects: number;
    openPRs: number;
    recentDeployments: number;
    activeIncidents: number;
    deploymentSuccessRate: number;
    errorRate: number;
    engineeringHealth: number;
  };
}

export interface DeploymentChartDataPoint {
  date: string;
  success: number;
  failed: number;
  total: number;
}

export interface PerformanceChartDataPoint {
  date: string;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'pr' | 'deployment' | 'incident' | 'project' | 'team';
  title: string;
  description: string;
  actor: string;
  actorAvatar: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
}
