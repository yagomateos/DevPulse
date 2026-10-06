import { index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import type { AIAnalysisKind } from '@/schemas/ai';
import type { WorkspaceSettings } from '@/schemas/settings';
import type { Deployment, Incident, PullRequest, TestSummary } from '@/types/domain';

/**
 * Deliberately small relational model. Columns that are filtered, sorted or
 * joined on are real columns; deep, read-only payloads (diffs, logs, timeline)
 * live in JSONB because the UI always reads them as a whole.
 */

export const roleEnum = pgEnum('role', ['ADMIN', 'MANAGER', 'DEVELOPER']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: roleEnum('role').notNull(),
  title: text('title').notNull().default(''),
  status: text('status', { enum: ['active', 'invited'] }).notNull(),
  presence: text('presence', { enum: ['online', 'away', 'offline'] }).notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true, mode: 'string' }).notNull(),
  /** scrypt hash (see server/auth/password.ts). Null for seeded demo accounts, which use the demo password. */
  passwordHash: text('password_hash'),
});

/**
 * Pending invitations. Only a SHA-256 hash of the token is stored, so a
 * database leak cannot be turned into working invite links.
 */
export const invitations = pgTable(
  'invitations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    invitedBy: text('invited_by').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (t) => [index('invitations_user_idx').on(t.userId)],
);

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  repository: text('repository').notNull(),
  defaultBranch: text('default_branch').notNull(),
  status: text('status', { enum: ['active', 'paused', 'archived'] }).notNull(),
  deploymentStatus: text('deployment_status', { enum: ['success', 'failed', 'in_progress', 'queued', 'cancelled'] }).notNull(),
  healthScore: integer('health_score').notNull(),
  lastDeploymentAt: timestamp('last_deployment_at', { withTimezone: true, mode: 'string' }),
  language: text('language').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  ownerId: text('owner_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
});

export const pullRequests = pgTable(
  'pull_requests',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    number: integer('number').notNull(),
    title: text('title').notNull(),
    author: text('author').notNull(),
    status: text('status', { enum: ['open', 'draft', 'merged', 'closed'] }).notNull(),
    riskScore: integer('risk_score').notNull(),
    riskLevel: text('risk_level', { enum: ['low', 'medium', 'high', 'critical'] }).notNull(),
    tests: jsonb('tests').$type<TestSummary>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
    /** Full aggregate (commits, files, checks, comments). */
    payload: jsonb('payload').$type<PullRequest>().notNull(),
  },
  (t) => [index('pull_requests_project_idx').on(t.projectId, t.updatedAt)],
);

export const deployments = pgTable(
  'deployments',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    number: integer('number').notNull(),
    status: text('status', { enum: ['success', 'failed', 'in_progress', 'queued', 'cancelled'] }).notNull(),
    environment: text('environment', { enum: ['production', 'staging', 'preview'] }).notNull(),
    commitSha: text('commit_sha').notNull(),
    commitMessage: text('commit_message').notNull(),
    author: text('author').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).notNull(),
    payload: jsonb('payload').$type<Deployment>().notNull(),
  },
  (t) => [index('deployments_project_idx').on(t.projectId, t.startedAt)],
);

export const incidents = pgTable(
  'incidents',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    severity: text('severity', { enum: ['sev1', 'sev2', 'sev3', 'sev4'] }).notNull(),
    status: text('status', { enum: ['investigating', 'identified', 'monitoring', 'resolved'] }).notNull(),
    service: text('service').notNull(),
    assignee: text('assignee'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    payload: jsonb('payload').$type<Incident>().notNull(),
  },
  (t) => [index('incidents_project_idx').on(t.projectId, t.createdAt)],
);

export const teamMembers = pgTable(
  'team_members',
  {
    projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
);

export const aiAnalyses = pgTable(
  'ai_analyses',
  {
    id: text('id').primaryKey(),
    kind: text('kind').$type<AIAnalysisKind>().notNull(),
    targetId: text('target_id').notNull(),
    model: text('model').notNull(),
    result: jsonb('result').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (t) => [index('ai_analyses_target_idx').on(t.kind, t.targetId, t.createdAt)],
);

export const workspaceSettings = pgTable('workspace_settings', {
  id: text('id').primaryKey(),
  value: jsonb('value').$type<WorkspaceSettings>().notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['incident', 'deployment', 'review', 'mention'] }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  href: text('href').notNull(),
  read: integer('read').notNull().default(0),
  severity: text('severity', { enum: ['sev1', 'sev2', 'sev3', 'sev4'] }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
});
