import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/server/auth/session';
import { parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(async () => {
  await requireSession();
  return NextResponse.json(await (await getRepository()).notifications.list());
});

const markReadSchema = z.object({ ids: z.union([z.literal('all'), z.array(z.string()).min(1)]) });

export const PATCH = route(async (request) => {
  await requireSession();
  const { ids } = await parseBody(request, markReadSchema);
  return NextResponse.json(await (await getRepository()).notifications.markRead(ids));
});
