// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDataset } from '../data/dataset';
import { createPostgresRepository } from '../repositories/postgres-repository';
import type { Database } from './client';
import * as schema from './schema';
import { refreshDemoData, seedDatabase } from './seed-data';

/** The daily demo refresh must restore demo data without touching user-created projects. */
const dataset = () => createDataset(Date.UTC(2026, 9, 5, 10));
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeEach(async () => {
  const client = new PGlite();
  db = drizzle(client, { schema });
  const migration = readFileSync(join(process.cwd(), 'drizzle/0000_init.sql'), 'utf8');
  for (const statement of migration.split('--> statement-breakpoint')) {
    if (statement.trim()) await client.exec(statement);
  }
  await seedDatabase(db, dataset());
}, 60_000);

describe('refreshDemoData (PGlite)', () => {
  it('keeps user projects with their synced PRs and restores the demo projects', async () => {
    const repo = createPostgresRepository(db as unknown as Database);
    const mine = await repo.projects.create({ name: 'XistraCloud', repository: 'yagomateos/XistraCloud', defaultBranch: 'main', language: 'TypeScript' }, 'usr_alex');
    const demoPr = (await repo.pullRequests.get('orion-gateway', 312))!;
    await repo.pullRequests.upsert({ ...demoPr, id: `${mine.id}#1`, projectId: mine.id, number: 1, title: 'Update README', status: 'open' });
    // A visitor vandalises a demo project; the refresh must undo it.
    await db.update(schema.projects).set({ name: 'defaced' }).where(eq(schema.projects.id, 'orion-gateway'));

    await refreshDemoData(db, dataset());

    expect(await repo.projects.get(mine.id)).toMatchObject({ name: 'XistraCloud', ownerId: 'usr_alex', openPullRequests: 1 });
    expect((await repo.pullRequests.get(mine.id, 1))?.title).toBe('Update README');
    expect((await repo.projects.get('orion-gateway'))?.name).not.toBe('defaced');
    expect((await repo.projects.list()).length).toBe(dataset().projects.length + 1);
  }, 60_000);

  it('detaches the owner when that member no longer exists after the refresh', async () => {
    const repo = createPostgresRepository(db as unknown as Database);
    const invited = await repo.team.invite({ name: 'Temp', email: 'temp@example.com', role: 'DEVELOPER' });
    const mine = await repo.projects.create({ name: 'Side project', repository: 'me/side', defaultBranch: 'main', language: 'Go' }, invited.id);

    await refreshDemoData(db, dataset());

    expect(await repo.team.get(invited.id)).toBeNull();
    expect((await repo.projects.get(mine.id))?.ownerId).toBe('');
  }, 60_000);
});
