import { NextResponse } from 'next/server';
import { createIncidentSchema } from '@/schemas/incident';
import { incidentQuerySchema } from '@/schemas/query';
import { requirePermission, requireSession } from '@/server/auth/session';
import { HttpError } from '@/server/auth/session';
import { parseBody, parseSearchParams, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(async (request) => {
  await requireSession();
  const query = parseSearchParams(request, incidentQuerySchema);
  return NextResponse.json(await (await getRepository()).incidents.list(query));
});

export const POST = route(async (request) => {
  const session = await requirePermission('incident:create');
  const input = await parseBody(request, createIncidentSchema);
  const repo = await getRepository();
  if (!(await repo.projects.get(input.projectId))) throw new HttpError(422, 'Unknown project');
  return NextResponse.json(await repo.incidents.create(input, session.user.name), { status: 201 });
});
