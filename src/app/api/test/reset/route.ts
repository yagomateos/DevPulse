import { NextResponse } from 'next/server';
import { notFound, route } from '@/server/http';
import { isResetAllowed, resetAllData } from '@/server/test-reset';

/** Test-only: reset the demo data (see server/test-reset.ts). Hidden as 404 otherwise. */
export const POST = route(
  async (request) => {
    if (!isResetAllowed(request.headers.get('x-test-reset-token'))) notFound('Route');
    await resetAllData();
    return NextResponse.json({ ok: true });
  },
  { simulate: false },
);
