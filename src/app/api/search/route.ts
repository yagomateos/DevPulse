import { NextResponse } from 'next/server';
import * as z from 'zod';
import { requireSession } from '@/server/auth/session';
import { parseSearchParams, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

const schema = z.object({ q: z.string().trim().max(100).default('') });

export const GET = route(async (request) => {
  await requireSession();
  const { q } = parseSearchParams(request, schema);
  return NextResponse.json(await (await getRepository()).search(q));
});
