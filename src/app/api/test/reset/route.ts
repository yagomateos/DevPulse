import { NextResponse, type NextRequest } from 'next/server';
import { notFound, route } from '@/server/http';
import { isResetAllowed, resetAllData } from '@/server/test-reset';

async function reset(request: NextRequest) {
  if (!isResetAllowed(request.headers.get('x-test-reset-token'), request.headers.get('authorization'))) notFound('Route');
  await resetAllData();
  return NextResponse.json({ ok: true, resetAt: new Date().toISOString() });
}

/** Test-only reset (Playwright global setup). Hidden as 404 when not allowed. */
export const POST = route(reset, { simulate: false });

/** Daily refresh of the public demo, invoked by Vercel Cron (see vercel.json). */
export const GET = route(reset, { simulate: false });
