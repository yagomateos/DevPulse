import { NextResponse } from 'next/server';
import { HttpError, requirePermission } from '@/server/auth/session';
import { syncProject } from '@/server/github/sync';
import { notFound, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

type Ctx = { params: Promise<{ projectId: string }> };

export const maxDuration = 120;

/** Manual "Sync now": a forced backfill of the project's recent pull requests. */
export const POST = route<Ctx>(
  async (_request, { params }) => {
    await requirePermission('project:update');
    const { projectId } = await params;
    const repo = await getRepository();
    const project = await repo.projects.get(projectId);
    if (!project) notFound('Project');
    const { integrations } = await repo.settings.get();
    if (!integrations.github.connected) throw new HttpError(409, 'GitHub is disconnected. Reconnect it in Settings → Integrations.');

    const result = await syncProject(repo, project, { force: true });
    if (result.failed && !result.synced) throw new HttpError(502, result.error ?? 'GitHub sync failed.');
    return NextResponse.json(result);
  },
  { simulate: false },
);
