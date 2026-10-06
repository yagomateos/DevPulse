import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(async (request) => {
  await requireSession();
  const projectId = request.nextUrl.searchParams.get('projectId') ?? undefined;
  return NextResponse.json(await (await getRepository()).incidents.facets(projectId));
});
