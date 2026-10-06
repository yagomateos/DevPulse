import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { Dataset } from '../data/dataset';
import { DEFAULT_SETTINGS } from '../repositories/defaults';
import * as schema from './schema';

type AnyPgDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Inserts the demo dataset. Shared by `npm run db:seed` and the integration tests. */
export async function seedDatabase(db: AnyPgDatabase, data: Dataset) {
  await db.transaction(async (tx) => {
    for (const table of [schema.aiAnalyses, schema.teamMembers, schema.notifications, schema.incidents, schema.deployments, schema.pullRequests, schema.projects, schema.users, schema.workspaceSettings]) {
      await tx.delete(table);
    }
    await tx.insert(schema.users).values(data.members);
    await tx.insert(schema.projects).values(data.projects.map(({ openPullRequests: _o, activeIncidents: _a, slug: _s, ...p }) => p));
    await tx.insert(schema.pullRequests).values(
      data.pullRequests.map((pr) => ({ id: pr.id, projectId: pr.projectId, number: pr.number, title: pr.title, author: pr.author, status: pr.status, riskScore: pr.riskScore, riskLevel: pr.riskLevel, tests: pr.tests, updatedAt: pr.updatedAt, payload: pr })),
    );
    await tx.insert(schema.deployments).values(
      data.deployments.map((d) => ({ id: d.id, projectId: d.projectId, number: d.number, status: d.status, environment: d.environment, commitSha: d.commitSha, commitMessage: d.commitMessage, author: d.author, durationSeconds: d.durationSeconds, startedAt: d.startedAt, payload: d })),
    );
    await tx.insert(schema.incidents).values(
      data.incidents.map((i) => ({ id: i.id, projectId: i.projectId, title: i.title, severity: i.severity, status: i.status, service: i.service, assignee: i.assignee, createdAt: i.createdAt, payload: i })),
    );
    await tx.insert(schema.teamMembers).values(
      data.projects.flatMap((p) => data.members.filter((m) => m.status === 'active').map((m) => ({ projectId: p.id, userId: m.id, role: m.role }))),
    );
    await tx.insert(schema.notifications).values(data.notifications.map((n) => ({ ...n, severity: n.severity ?? null, read: n.read ? 1 : 0 })));
    await tx.insert(schema.workspaceSettings).values({ id: 'default', value: DEFAULT_SETTINGS });
  });
}
