import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { DEMO_MODEL, getAIConfig } from '@/server/ai/config';
import { route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(
  async () => {
    await requireSession();
    const settings = (await (await getRepository()).settings.get()).ai;
    const config = getAIConfig(settings.model);
    return NextResponse.json({ live: config.live, model: config.live ? config.model : DEMO_MODEL });
  },
  { simulate: false },
);
