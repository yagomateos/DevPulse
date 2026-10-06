// @vitest-environment node
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDb } from '../../../tests/setup/pglite';
import { createDataset } from '../data/dataset';
import { createPostgresRepository } from '../repositories/postgres-repository';
import type { Database } from './client';
import * as schema from './schema';
import { refreshDemoData, seedDatabase } from './seed-data';

/** The daily demo refresh must restore demo data without touching user-created projects. */
const dataset = () => createDataset(Date.UTC(2026, 9, 5, 10));
let db: Awaited<ReturnType<typeof createTestDb>>;

beforeEach(async () => {
  db = await createTestDb();
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

describe('invitations and credentials (PGlite)', () => {
  const day = 86_400_000;
  const invite = async (repo: ReturnType<typeof createPostgresRepository>, email: string, expiresInMs: number) => {
    const member = await repo.team.invite({ name: email.split('@')[0]!, email, role: 'DEVELOPER' });
    const invitation = await repo.invitations.create({ userId: member.id, tokenHash: `hash-${email}`, invitedBy: 'usr_alex', expiresAt: new Date(Date.now() + expiresInMs).toISOString() });
    return { member, invitation };
  };

  it('never exposes password hashes and accepts an invitation only once', async () => {
    const repo = createPostgresRepository(db as unknown as Database);
    const { member, invitation } = await invite(repo, 'sam@example.com', 7 * day);
    expect(await repo.invitations.findByTokenHash('hash-sam@example.com')).toMatchObject({ id: invitation.id, acceptedAt: null });

    expect(await repo.invitations.accept(invitation.id, 'scrypt$hash')).toMatchObject({ id: member.id, status: 'active' });
    expect(await repo.invitations.accept(invitation.id, 'scrypt$other')).toBeNull();
    expect(await repo.auth.passwordHash(member.id)).toBe('scrypt$hash');

    const listed = (await repo.team.list()).find((m) => m.id === member.id)!;
    expect(listed).not.toHaveProperty('passwordHash');
    expect(await repo.team.get(member.id)).not.toHaveProperty('passwordHash');
  }, 60_000);

  it('treats _ and % in emails literally when checking for duplicates', async () => {
    const repo = createPostgresRepository(db as unknown as Database);
    await repo.team.invite({ name: 'Ann', email: 'a_b@example.com', role: 'DEVELOPER' });
    await expect(repo.team.invite({ name: 'Axe', email: 'axb@example.com', role: 'DEVELOPER' })).resolves.toMatchObject({ email: 'axb@example.com' });
    await expect(repo.team.invite({ name: 'Ann 2', email: 'A_B@example.com', role: 'DEVELOPER' })).rejects.toThrow(/already exists/);
  }, 60_000);

  it('keeps joined and still-invited people through the nightly refresh, drops abandoned invites', async () => {
    const repo = createPostgresRepository(db as unknown as Database);
    const joined = await invite(repo, 'joined@example.com', 7 * day);
    await repo.invitations.accept(joined.invitation.id, 'scrypt$joined');
    const pending = await invite(repo, 'pending@example.com', 7 * day);
    const abandoned = await invite(repo, 'abandoned@example.com', -day);
    await repo.auth.setPasswordHash('usr_alex', 'scrypt$changed-by-a-visitor');

    await refreshDemoData(db, dataset());

    expect(await repo.team.get(joined.member.id)).toMatchObject({ status: 'active' });
    expect(await repo.auth.passwordHash(joined.member.id)).toBe('scrypt$joined');
    expect(await repo.invitations.findByTokenHash('hash-pending@example.com')).toMatchObject({ id: pending.invitation.id });
    expect(await repo.team.get(abandoned.member.id)).toBeNull();
    // Demo accounts go back to the documented demo password.
    expect(await repo.auth.passwordHash('usr_alex')).toBeNull();
  }, 60_000);
});
