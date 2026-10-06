import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './repositories/defaults';
import { createMemoryRepository, resetMemoryStore } from './repositories/memory-repository';
import { dispatchIncidentIntegrations } from './integrations';

const input = { projectId: 'orion-gateway', title: 'Token endpoint returns 502', description: 'Clients receive 502 errors from POST /v1/token.', service: 'auth-service', assignee: null, relatedDeploymentId: null };

describe('mock integrations', () => {
  beforeEach(() => resetMemoryStore());

  it('records Slack and PagerDuty deliveries on the timeline for a SEV1', async () => {
    const repo = createMemoryRepository();
    const incident = await repo.incidents.create({ ...input, severity: 'sev1' }, 'Alex Chen');
    const settings = { ...DEFAULT_SETTINGS.integrations, slack: { connected: true, channel: '#ops' }, pagerduty: { connected: true, serviceKey: 'PX1' } };
    const result = await dispatchIncidentIntegrations(repo, incident, settings, 'Alex Chen');
    const notes = result.timeline.filter((e) => e.type === 'note').map((e) => e.description);
    expect(notes).toEqual([expect.stringContaining('Slack · mock connector] Posted incident summary to #ops'), expect.stringContaining('PagerDuty · mock connector] Paged on-call for auth-service')]);
  });

  it('does not page for low severities or disconnected services', async () => {
    const repo = createMemoryRepository();
    const incident = await repo.incidents.create({ ...input, severity: 'sev4' }, 'Alex Chen');
    const settings = { ...DEFAULT_SETTINGS.integrations, slack: { connected: false, channel: '' }, pagerduty: { connected: true, serviceKey: 'PX1' } };
    const result = await dispatchIncidentIntegrations(repo, incident, settings, 'Alex Chen');
    expect(result.timeline.some((e) => e.type === 'note')).toBe(false);
  });
});
