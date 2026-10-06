import { NextResponse } from 'next/server';
import { accountSettingsSchema } from '@/schemas/settings';
import { requireSession } from '@/server/auth/session';
import { notFound, parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

/** The signed-in user's own profile. */
export const PUT = route(async (request) => {
  const session = await requireSession();
  const input = await parseBody(request, accountSettingsSchema);
  const repo = await getRepository();
  const clash = (await repo.team.list()).find((m) => m.email.toLowerCase() === input.email.toLowerCase() && m.id !== session.user.id);
  if (clash) {
    return NextResponse.json({ error: { message: 'Validation failed', status: 422, issues: [{ path: 'email', message: 'This email is already used by another member' }] } }, { status: 422 });
  }
  const member = await repo.team.updateAccount(session.user.id, input);
  return member ? NextResponse.json(member) : notFound('Account');
});
