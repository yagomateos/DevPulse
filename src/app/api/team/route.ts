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
    throw new HttpError(409, error instanceof Error ? error.message : 'Could not invite member');
  }
});
