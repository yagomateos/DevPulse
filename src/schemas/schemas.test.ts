import { describe, expect, it } from 'vitest';
import { createIncidentSchema } from './incident';
import { createProjectSchema, projectSettingsSchema } from './project';
import { pullRequestQuerySchema } from './query';
import { securitySettingsSchema } from './settings';

const messages = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  // First issue per field, matching what React Hook Form displays.
  Object.fromEntries([...(result.error?.issues ?? [])].reverse().map((i) => [i.path.join('.'), i.message]));

describe('form schemas', () => {
  it('requires owner/name repositories for projects', () => {
    const result = createProjectSchema.safeParse({ name: 'Billing', repository: 'billing', defaultBranch: 'main', language: 'Go' });
    expect(messages(result).repository).toMatch(/owner\/repository/);
    expect(createProjectSchema.safeParse({ name: 'Billing', repository: 'acme/billing', defaultBranch: 'main', language: 'Go' }).success).toBe(true);
  });

  it('limits project tags to six', () => {
    const result = projectSettingsSchema.safeParse({ name: 'Billing', repository: 'acme/billing', defaultBranch: 'main', language: 'Go', status: 'active', tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
    expect(messages(result).tags).toBe('Use at most 6 tags');
  });

  it('validates incident fields with helpful messages', () => {
    const result = createIncidentSchema.safeParse({ projectId: '', title: 'Down', description: 'short', severity: 'sev2', service: 'x', assignee: null, relatedDeploymentId: null });
    const errors = messages(result);
    expect(errors.projectId).toBe('Select a project');
    expect(errors.title).toMatch(/at least 8/);
    expect(errors.description).toMatch(/20\+ characters/);
    expect(errors.service).toBe('Service is required');
  });

  it('enforces password strength and confirmation', () => {
    const weak = securitySettingsSchema.safeParse({ currentPassword: 'x', newPassword: 'short', confirmPassword: 'short' });
    expect(messages(weak).newPassword).toMatch(/10 characters/);
    const mismatch = securitySettingsSchema.safeParse({ currentPassword: 'x', newPassword: 'Correct1horse', confirmPassword: 'Correct1hors' });
    expect(messages(mismatch).confirmPassword).toBe('Passwords do not match');
  });
});

describe('list query schema', () => {
  it('parses comma separated filters and coerces pagination', () => {
    const q = pullRequestQuerySchema.parse({ status: 'open,draft', risk: 'high', page: '2', pageSize: '20' });
    expect(q).toMatchObject({ status: ['open', 'draft'], risk: ['high'], page: 2, pageSize: 20 });
  });

  it('rejects unknown filter values and malformed sort', () => {
    expect(pullRequestQuerySchema.safeParse({ status: 'exploded' }).success).toBe(false);
    expect(pullRequestQuerySchema.safeParse({ sort: 'risk;drop' }).success).toBe(false);
  });
});

describe('settings schema', () => {
  it('only accepts real IANA time zones', async () => {
    const { generalSettingsSchema } = await import('./settings');
    const base = { workspaceName: 'Acme', defaultLanding: 'dashboard', network: { latency: 'instant', failureRate: '0' } } as const;
    expect(generalSettingsSchema.safeParse({ ...base, timezone: 'Asia/Tokyo' }).success).toBe(true);
    expect(generalSettingsSchema.safeParse({ ...base, timezone: 'Mars/Olympus' }).success).toBe(false);
  });
});
