import type { AIAnalysisEnvelope, AIAnalysisKind } from '@/schemas/ai';
import type { CreateIncidentInput, UpdateIncidentInput } from '@/schemas/incident';
import type { CreateProjectInput, ProjectSettingsInput } from '@/schemas/project';
import type { DashboardQuery, DeploymentQuery, IncidentQuery, PullRequestQuery } from '@/schemas/query';
import type { AccountSettings, WorkspaceSettings } from '@/schemas/settings';
import type { InviteMemberInput } from '@/schemas/team';
import type {
  ActivityItem,
  DashboardMetrics,
  Deployment,
  DeploymentSeriesPoint,
  DeploymentSummary,
  Incident,
  IncidentSummary,
  Notification,
  Paginated,
  PerformanceSeriesPoint,
  Project,
  PullRequest,
  PullRequestSummary,
  Role,
  SearchResult,
  TeamMember,
} from '@/types/domain';

/**
 * The single seam between the app and its data source. Route handlers and
 * Server Components only talk to this interface, so the in-memory demo store
 * can be swapped for Postgres (Drizzle) without touching the UI.
 */
export interface Invitation {
  id: string;
  userId: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface Repository {
  projects: {
    list(filter?: { q?: string }): Promise<Project[]>;
    get(id: string): Promise<Project | null>;
    create(input: CreateProjectInput, ownerId: string): Promise<Project>;
    update(id: string, input: ProjectSettingsInput): Promise<Project | null>;
  };
  pullRequests: {
    list(query: PullRequestQuery): Promise<Paginated<PullRequestSummary>>;
    get(projectId: string, number: number): Promise<PullRequest | null>;
    /** Insert or replace by id. Used by the GitHub sync; must be idempotent. */
    upsert(pr: PullRequest): Promise<void>;
  };
  deployments: {
    list(query: DeploymentQuery): Promise<Paginated<DeploymentSummary>>;
    get(projectId: string, number: number): Promise<Deployment | null>;
    getById(id: string): Promise<Deployment | null>;
  };
  incidents: {
    list(query: IncidentQuery): Promise<Paginated<IncidentSummary>>;
    facets(projectId?: string): Promise<{ services: string[]; assignees: string[] }>;
    get(id: string): Promise<Incident | null>;
    create(input: CreateIncidentInput, actor: string): Promise<Incident>;
    update(id: string, input: UpdateIncidentInput, actor: string): Promise<Incident | null>;
  };
  team: {
    list(): Promise<TeamMember[]>;
    get(id: string): Promise<TeamMember | null>;
    invite(input: InviteMemberInput): Promise<TeamMember>;
    updateRole(id: string, role: Role): Promise<TeamMember | null>;
    updateAccount(id: string, input: AccountSettings): Promise<TeamMember | null>;
    remove(id: string): Promise<boolean>;
  };
  /** Credentials never travel with TeamMember: they are read and written only here. */
  auth: {
    passwordHash(userId: string): Promise<string | null>;
    setPasswordHash(userId: string, hash: string): Promise<void>;
  };
  invitations: {
    /** Replaces the member's pending invitations, so only the newest link works. */
    create(input: { userId: string; tokenHash: string; invitedBy: string; expiresAt: string }): Promise<Invitation>;
    findByTokenHash(tokenHash: string): Promise<Invitation | null>;
    /**
     * Atomically marks the invitation accepted, activates the member and stores
     * the password hash. Returns null if it was already accepted (double submit).
     */
    accept(id: string, passwordHash: string): Promise<TeamMember | null>;
  };
  notifications: {
    list(): Promise<Notification[]>;
    markRead(ids: string[] | 'all'): Promise<Notification[]>;
  };
  analytics: {
    metrics(query: DashboardQuery): Promise<DashboardMetrics>;
    deploymentSeries(query: DashboardQuery): Promise<DeploymentSeriesPoint[]>;
    performanceSeries(query: DashboardQuery): Promise<PerformanceSeriesPoint[]>;
    activity(filter: { projectId?: string; limit?: number }): Promise<ActivityItem[]>;
  };
  search(q: string): Promise<SearchResult[]>;
  settings: {
    get(): Promise<WorkspaceSettings>;
    update<K extends keyof WorkspaceSettings>(section: K, value: WorkspaceSettings[K]): Promise<WorkspaceSettings>;
  };
  aiAnalyses: {
    latest<K extends AIAnalysisKind>(kind: K, targetId: string): Promise<AIAnalysisEnvelope<K> | null>;
    save<K extends AIAnalysisKind>(envelope: AIAnalysisEnvelope<K>): Promise<void>;
  };
}
