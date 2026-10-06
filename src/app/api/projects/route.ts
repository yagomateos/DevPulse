import { NextResponse } from 'next/server';
import { createProjectSchema } from '@/schemas/project';
import { requirePermission, requireSession } from '@/server/auth/session';
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
  return NextResponse.json(await repo.projects.create(input, session.user.id), { status: 201 });
});
