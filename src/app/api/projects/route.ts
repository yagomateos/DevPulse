import { after, NextResponse } from 'next/server';
import { createProjectSchema } from '@/schemas/project';
import { requirePermission, requireSession } from '@/server/auth/session';
import { syncProject } from '@/server/github/sync';
import { parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(async (request) => {
  await requireSession();
  const repo = await getRepository();
  return NextResponse.json(await repo.projects.list({ q: request.nextUrl.searchParams.get('q') ?? undefined }));
});

export const POST = route(async (request) => {
  const session = await requirePermission('project:create');
  const input = await parseBody(request, createProjectSchema);
  const repo = await getRepository();
  const project = await repo.projects.create(input, session.user.id);
  // Backfill existing pull requests without making the user wait for GitHub.
  after(async () => {
    if (!(await repo.settings.get()).integrations.github.connected) return;
    const result = await syncProject(repo, project);
    if (result.error) console.warn(`[github-sync] initial backfill for ${project.id}: ${result.error}`);
  });
  return NextResponse.json(project, { status: 201 });
});
