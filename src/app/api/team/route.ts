import { NextResponse } from 'next/server';
import { inviteMemberSchema } from '@/schemas/team';
import { HttpError, requirePermission, requireSession } from '@/server/auth/session';
import { parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';
import { appUrlFor, issueInvitation } from '@/server/team/invitations';

export const GET = route(async () => {
  await requireSession();
  return NextResponse.json(await (await getRepository()).team.list());
});

/** Adds the member as "invited" and emails them a single-use link to set their password. */
export const POST = route(async (request) => {
  const session = await requirePermission('team:invite');
  const input = await parseBody(request, inviteMemberSchema);
  if (input.role === 'ADMIN' && session.user.role !== 'ADMIN') throw new HttpError(403, 'Only admins can invite admins.');
  const repo = await getRepository();
  let member;
  try {
    member = await repo.team.invite(input);
  } catch (error) {
    // Never echo raw storage errors to the client; only the known conflict is user-facing.
    if (error instanceof Error && /already exists/.test(error.message)) {
      return NextResponse.json({ error: { message: 'Validation failed', status: 422, issues: [{ path: 'email', message: 'A member with this email already exists' }] } }, { status: 422 });
    }
    throw error;
  }
  const invitation = await issueInvitation(repo, member, session.user, appUrlFor(request));
  return NextResponse.json({ member, invitation }, { status: 201 });
});
