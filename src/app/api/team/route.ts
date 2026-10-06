import { NextResponse } from 'next/server';
import { inviteMemberSchema } from '@/schemas/team';
import { HttpError, requirePermission, requireSession } from '@/server/auth/session';
import { parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route(async () => {
  await requireSession();
  return NextResponse.json(await (await getRepository()).team.list());
});

export const POST = route(async (request) => {
  const session = await requirePermission('team:invite');
  const input = await parseBody(request, inviteMemberSchema);
  if (input.role === 'ADMIN' && session.user.role !== 'ADMIN') throw new HttpError(403, 'Only admins can invite admins.');
  try {
    return NextResponse.json(await (await getRepository()).team.invite(input), { status: 201 });
  } catch (error) {
    // Never echo raw storage errors to the client; only the known conflict is user-facing.
    if (error instanceof Error && /already exists/.test(error.message)) {
      return NextResponse.json({ error: { message: 'Validation failed', status: 422, issues: [{ path: 'email', message: 'A member with this email already exists' }] } }, { status: 422 });
    }
    throw error;
  }
});
