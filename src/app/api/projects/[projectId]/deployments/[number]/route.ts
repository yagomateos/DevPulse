import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { notFound, parseNumberParam, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route<{ params: Promise<{ projectId: string; number: string }> }>(async (_request, { params }) => {
  await requireSession();
  const { projectId, number } = await params;
  const deployment = await (await getRepository()).deployments.get(projectId, parseNumberParam(number, 'Deployment'));
  return deployment ? NextResponse.json(deployment) : notFound('Deployment');
});
