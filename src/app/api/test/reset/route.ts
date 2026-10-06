import { NextResponse, type NextRequest } from 'next/server';
import { notFound, route } from '@/server/http';
import { isResetAllowed, resetAllData } from '@/server/test-reset';

function reset(options: { keepUserProjects: boolean }) {
  return async (request: NextRequest) => {
    if (!isResetAllowed(request.headers.get('x-test-reset-token'), request.headers.get('authorization'))) notFound('Route');
    await resetAllData(options);
    return NextResponse.json({ ok: true, resetAt: new Date().toISOString() });
  };
}

/** Test-only full reset (Playwright global setup). Hidden as 404 when not allowed. */
export const POST = route(reset({ keepUserProjects: false }), { simulate: false });

/** Daily refresh of the public demo, invoked by Vercel Cron (see vercel.json). Keeps user-created projects. */
export const GET = route(reset({ keepUserProjects: true }), { simulate: false });
