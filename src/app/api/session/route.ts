import { NextResponse } from 'next/server';
import { getSession } from '@/server/auth/session';
import { route } from '@/server/http';

/** Lightweight endpoint the client polls to detect expiry. */
export const GET = route(
  async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: { message: 'Session expired', status: 401 } }, { status: 401 });
    return NextResponse.json(session);
  },
  { simulate: false },
);
