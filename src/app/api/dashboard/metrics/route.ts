import { NextResponse } from 'next/server';
import { dashboardQuerySchema } from '@/schemas/query';
import { requireSession } from '@/server/auth/session';
import { parseSearchParams, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(async (request) => {
  await requireSession();
  const query = parseSearchParams(request, dashboardQuerySchema);
  return NextResponse.json(await (await getRepository()).analytics.metrics(query));
});
