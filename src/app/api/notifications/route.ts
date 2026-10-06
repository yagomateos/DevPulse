import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/server/auth/session';
import { parseBody, route } from '@/server/http';
import { applyNotificationPreferences } from '@/server/notifications';
import { getRepository } from '@/server/repositories';

export const GET = route(async () => {
  await requireSession();
  const repo = await getRepository();
  const [list, settings] = await Promise.all([repo.notifications.list(), repo.settings.get()]);
  return NextResponse.json(applyNotificationPreferences(list, settings.notifications));
});

const markReadSchema = z.object({ ids: z.union([z.literal('all'), z.array(z.string()).min(1)]) });

export const PATCH = route(async (request) => {
  await requireSession();
  const { ids } = await parseBody(request, markReadSchema);
  const repo = await getRepository();
  const [list, settings] = await Promise.all([repo.notifications.markRead(ids), repo.settings.get()]);
  return NextResponse.json(applyNotificationPreferences(list, settings.notifications));
});
