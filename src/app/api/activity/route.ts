import { NextResponse } from 'next/server';
import * as z from 'zod';
import { requireSession } from '@/server/auth/session';
import { parseSearchParams, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

const schema = z.object({ projectId: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).default(12) });

export const GET = route(async (request) => {
  await requireSession();
  return NextResponse.json(await (await getRepository()).analytics.activity(parseSearchParams(request, schema)));
});
