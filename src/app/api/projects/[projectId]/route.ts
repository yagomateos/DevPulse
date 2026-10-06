import { NextResponse } from 'next/server';
import { projectSettingsSchema } from '@/schemas/project';
import { requirePermission, requireSession } from '@/server/auth/session';
import { notFound, parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

type Ctx = { params: Promise<{ projectId: string }> };

export const GET = route<Ctx>(async (_request, { params }) => {
  await requireSession();
  const { projectId } = await params;
  const project = await (await getRepository()).projects.get(projectId);
  return project ? NextResponse.json(project) : notFound('Project');
});

export const PATCH = route<Ctx>(async (request, { params }) => {
  await requirePermission('project:update');
  const { projectId } = await params;
  const input = await parseBody(request, projectSettingsSchema);
  const project = await (await getRepository()).projects.update(projectId, input);
  return project ? NextResponse.json(project) : notFound('Project');
});
