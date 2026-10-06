import { NextResponse } from 'next/server';
import { securitySettingsSchema } from '@/schemas/settings';
import { setPassword, verifyPassword } from '@/server/auth/credentials';
import { requireSession } from '@/server/auth/session';
import { parseBody, route } from '@/server/http';

export const POST = route(async (request) => {
  const session = await requireSession();
  const input = await parseBody(request, securitySettingsSchema);
  if (!verifyPassword(session.user.id, input.currentPassword)) {
    return NextResponse.json({ error: { message: 'Validation failed', status: 422, issues: [{ path: 'currentPassword', message: 'Current password is incorrect' }] } }, { status: 422 });
  }
  setPassword(session.user.id, input.newPassword);
  return new NextResponse(null, { status: 204 });
});
