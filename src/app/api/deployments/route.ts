import { NextResponse } from 'next/server';
import { deploymentQuerySchema } from '@/schemas/query';
import { requireSession } from '@/server/auth/session';
import { parseSearchParams, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(async (request) => {
  await requireSession();
  const query = parseSearchParams(request, deploymentQuerySchema);
  return NextResponse.json(await (await getRepository()).deployments.list(query));
});
