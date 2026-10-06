import { NextResponse } from 'next/server';
import { updateIncidentSchema } from '@/schemas/incident';
import { requirePermission, requireSession } from '@/server/auth/session';
import { notFound, parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

type Ctx = { params: Promise<{ incidentId: string }> };

export const GET = route<Ctx>(async (_request, { params }) => {
  await requireSession();
  const incident = await (await getRepository()).incidents.get((await params).incidentId);
  return incident ? NextResponse.json(incident) : notFound('Incident');
});

export const PATCH = route<Ctx>(async (request, { params }) => {
  const session = await requirePermission('incident:update');
  const input = await parseBody(request, updateIncidentSchema);
  const incident = await (await getRepository()).incidents.update((await params).incidentId, input, session.user.name);
  return incident ? NextResponse.json(incident) : notFound('Incident');
});
