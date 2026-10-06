// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { deploymentQuerySchema, incidentQuerySchema, pullRequestQuerySchema } from '@/schemas/query';
import { createDataset } from '../data/dataset';
import type { Database } from '../db/client';
import * as schema from '../db/schema';
import { seedDatabase } from '../db/seed-data';
import { createPostgresRepository } from './postgres-repository';
import type { Repository } from './types';

/**
 * Integration test against a real Postgres engine (PGlite, in-process WASM):
 * applies the generated Drizzle migration, seeds the demo data and exercises
 * the SQL repository through the same contract the app uses.
 */
let repo: Repository;

beforeAll(async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  const migration = readFileSync(join(process.cwd(), 'drizzle/0000_init.sql'), 'utf8');
  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) await client.exec(statement);
  }
  await seedDatabase(db, createDataset(Date.UTC(2026, 9, 5, 10)));
  // Same Drizzle query builder API; only the driver differs from postgres-js.
  repo = createPostgresRepository(db as unknown as Database);
}, 60_000);

describe('postgres repository (PGlite)', () => {
  it('derives project counters with SQL aggregates', async () => {
    const orion = await repo.projects.get('orion-gateway');
    expect(orion).toMatchObject({ name: 'Orion API Gateway', activeIncidents: 2, deploymentStatus: 'failed' });
  });

  it('filters, sorts and paginates pull requests in SQL', async () => {
    const page = await repo.pullRequests.list(pullRequestQuerySchema.parse({ projectId: 'orion-gateway', risk: 'high,critical', sort: 'risk.desc', pageSize: '2' }));
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((p) => ['high', 'critical'].includes(p.riskLevel))).toBe(true);
    expect(page.items[0]).not.toHaveProperty('files');
    const pr = await repo.pullRequests.get('orion-gateway', 312);
    expect(pr?.files).toHaveLength(4);
  });

  it('searches deployments by SHA with ILIKE', async () => {
    const page = await repo.deployments.list(deploymentQuerySchema.parse({ q: 'B8E2C41' }));
    expect(page.items.map((d) => d.number)).toContain(128);
  });

  it('matches the in-memory store when declaring incidents (timeline, ids, notification)', async () => {
    const created = await repo.incidents.create({ projectId: 'orion-gateway', title: 'Auth latency regression', description: 'p95 above SLO after deploy #128.', severity: 'sev2', service: 'auth-service', assignee: 'Sarah Kim', relatedDeploymentId: 'orion-gateway~128' }, 'Alex Chen');
    expect(created.id).toBe('inc-43');
    expect(created.timeline.map((e) => e.type)).toEqual(['deployment', 'created']);
    const notifications = await repo.notifications.list();
    expect(notifications[0]).toMatchObject({ id: 'ntf-inc-43', severity: 'sev2' });
    const facets = await repo.incidents.facets('orion-gateway');
    expect(facets.services).toEqual(expect.arrayContaining(['api-gateway', 'rate-limiter']));
  });

  it('suffixes duplicate project slugs and rejects duplicate invitations', async () => {
    const project = await repo.projects.create({ name: 'Atlas Web', repository: 'acme/atlas-web-2', defaultBranch: 'main', language: 'TypeScript', description: '' }, 'usr_alex');
    expect(project.id).toBe('atlas-web-2'); // 'atlas-web' already exists in the seed
    const again = await repo.projects.create({ name: 'Atlas Web', repository: 'acme/atlas-web-3', defaultBranch: 'main', language: 'TypeScript', description: '' }, 'usr_alex');
    expect(again.id).toBe('atlas-web-3');
    await expect(repo.team.invite({ name: 'Dup', email: 'SARAH.KIM@acme.dev', role: 'DEVELOPER' })).rejects.toThrow(/already exists/);
  });

  it('creates and updates incidents', async () => {
    const created = await repo.incidents.create({ projectId: 'nimbus-ds', title: 'Docs search returns no results', description: 'Search index rebuild failed overnight.', severity: 'sev3', service: 'docs-site', assignee: null, relatedDeploymentId: null }, 'Alex Chen');
    const list = await repo.incidents.list(incidentQuerySchema.parse({ projectId: 'nimbus-ds', status: 'investigating' }));
    expect(list.items.map((i) => i.id)).toContain(created.id);
    const resolved = await repo.incidents.update(created.id, { status: 'resolved' }, 'Alex Chen');
    expect(resolved?.status).toBe('resolved');
    expect((await repo.incidents.get(created.id))?.timeline.map((e) => e.type)).toEqual(['created', 'resolution']);
  });

  it('persists settings, team changes and AI analyses', async () => {
    const settings = await repo.settings.get();
    await repo.settings.update('ai', { ...settings.ai, temperature: 0.7 });
    expect((await repo.settings.get()).ai.temperature).toBe(0.7);

    const member = await repo.team.updateRole('usr_jordan', 'MANAGER');
    expect(member?.role).toBe('MANAGER');

    await repo.aiAnalyses.save({ id: 'ana_1', kind: 'incident', targetId: 'inc-42', model: 'demo', createdAt: new Date().toISOString(), result: { summary: 's', likelyCause: 'c', evidence: [], affectedServices: [], recommendations: [], confidence: 0.5 } });
    expect((await repo.aiAnalyses.latest('incident', 'inc-42'))?.result.summary).toBe('s');
  });

  it('runs global search over database rows', async () => {
    const results = await repo.search('INC-42');
    expect(results[0]).toMatchObject({ type: 'incident', id: 'inc-42' });
  });
});
