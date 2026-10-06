import { NextResponse } from 'next/server';
import { changeRoleSchema } from '@/schemas/team';
import { HttpError, requirePermission } from '@/server/auth/session';
import { notFound, parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

type Ctx = { params: Promise<{ memberId: string }> };

export const PATCH = route<Ctx>(async (request, { params }) => {
  const session = await requirePermission('team:change-role');
  const { memberId } = await params;
  if (memberId === session.user.id) throw new HttpError(422, 'You cannot change your own role.');
  const { role } = await parseBody(request, changeRoleSchema);
  const member = await (await getRepository()).team.updateRole(memberId, role);
  return member ? NextResponse.json(member) : notFound('Member');
});

export const DELETE = route<Ctx>(async (_request, { params }) => {
  const session = await requirePermission('team:remove');
  const { memberId } = await params;
  if (memberId === session.user.id) throw new HttpError(422, 'You cannot remove yourself.');
  const removed = await (await getRepository()).team.remove(memberId);
  return removed ? new NextResponse(null, { status: 204 }) : notFound('Member');
});
