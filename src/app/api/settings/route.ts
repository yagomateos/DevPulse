import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(async () => {
  await requireSession();
  return NextResponse.json(await (await getRepository()).settings.get());
});
