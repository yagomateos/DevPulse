import { beforeEach, describe, expect, it } from 'vitest';
import { pullRequestQuerySchema, incidentQuerySchema } from '@/schemas/query';
import { createMemoryRepository, resetMemoryStore } from './memory-repository';

const prQuery = (input: Record<string, string> = {}) => pullRequestQuerySchema.parse(input);

describe('memory repository', () => {
  beforeEach(() => resetMemoryStore(Date.UTC(2026, 9, 5, 10)));

  it('filters, sorts and paginates pull requests like the SQL implementation', async () => {
    const repo = createMemoryRepository();
    const page = await repo.pullRequests.list(prQuery({ projectId: 'orion-gateway', sort: 'risk.desc', pageSize: '3' }));
    expect(page.items).toHaveLength(3);
    expect(page.items.every((p) => p.projectId === 'orion-gateway')).toBe(true);
    const scores = page.items.map((p) => p.riskScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(page.pageCount).toBe(Math.ceil(page.total / 3));
  });

  it('clamps out-of-range pages instead of returning nothing', async () => {
    const repo = createMemoryRepository();
    const page = await repo.pullRequests.list(prQuery({ page: '999' }));
    expect(page.page).toBe(page.pageCount);
    expect(page.items.length).toBeGreaterThan(0);
  });

  it('searches by number, title or author', async () => {
    const repo = createMemoryRepository();
    const page = await repo.pullRequests.list(prQuery({ q: '312' }));
    expect(page.items.map((p) => p.number)).toContain(312);
  });

  it('creates incidents, links deployments and updates project counters', async () => {
    const repo = createMemoryRepository();
    const before = (await repo.projects.get('atlas-web'))!.activeIncidents;
    const incident = await repo.incidents.create(
      { projectId: 'atlas-web', title: 'Checkout is timing out', description: 'Requests to checkout take more than 30s', severity: 'sev2', service: 'web-app', assignee: 'Priya Patel', relatedDeploymentId: 'atlas-web~512' },
      'Alex Chen',
    );
    expect(incident.timeline.map((e) => e.type)).toEqual(['deployment', 'created']);
    expect((await repo.projects.get('atlas-web'))!.activeIncidents).toBe(before + 1);
    const list = await repo.incidents.list(incidentQuerySchema.parse({ projectId: 'atlas-web', severity: 'sev2' }));
    expect(list.items[0]?.id).toBe(incident.id);
  });

  it('appends a timeline event on status change and sets resolvedAt', async () => {
    const repo = createMemoryRepository();
    const updated = await repo.incidents.update('inc-42', { status: 'resolved', note: 'Pool recycled' }, 'Alex Chen');
    expect(updated?.resolvedAt).not.toBeNull();
    expect(updated?.timeline.at(-1)).toMatchObject({ type: 'resolution', description: 'Pool recycled' });
  });

  it('groups global search results and caps each group', async () => {
    const repo = createMemoryRepository();
    const results = await repo.search('a');
    const perType = results.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.type]: (acc[r.type] ?? 0) + 1 }), {});
    expect(Math.max(...Object.values(perType))).toBeLessThanOrEqual(5);
    expect(await repo.search('   ')).toEqual([]);
  });

  it('rejects duplicate invitations', async () => {
    const repo = createMemoryRepository();
    await expect(repo.team.invite({ name: 'Dup', email: 'SARAH.KIM@acme.dev', role: 'DEVELOPER' })).rejects.toThrow(/already exists/);
  });
});
