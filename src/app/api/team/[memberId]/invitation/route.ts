import { NextResponse } from 'next/server';
import { HttpError, requirePermission } from '@/server/auth/session';
import { notFound, route } from '@/server/http';
import { getRepository } from '@/server/repositories';
import { appUrlFor, issueInvitation } from '@/server/team/invitations';

type Ctx = { params: Promise<{ memberId: string }> };

/** Re-sends an invitation with a fresh link; the previous link stops working. */
export const POST = route<Ctx>(async (request, { params }) => {
  const session = await requirePermission('team:invite');
  const { memberId } = await params;
  const repo = await getRepository();
  const member = await repo.team.get(memberId);
  if (!member) notFound('Member');
  if (member.status !== 'invited') throw new HttpError(409, 'This member has already joined.');
  if (member.role === 'ADMIN' && session.user.role !== 'ADMIN') throw new HttpError(403, 'Only admins can invite admins.');
  return NextResponse.json({ member, invitation: await issueInvitation(repo, member, session.user, appUrlFor(request)) });
});
