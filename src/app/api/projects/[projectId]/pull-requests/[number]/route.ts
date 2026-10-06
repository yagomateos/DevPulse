import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { notFound, parseNumberParam, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

export const GET = route<{ params: Promise<{ projectId: string; number: string }> }>(async (_request, { params }) => {
  await requireSession();
  const { projectId, number } = await params;
  const pr = await (await getRepository()).pullRequests.get(projectId, parseNumberParam(number, 'Pull request'));
  return pr ? NextResponse.json(pr) : notFound('Pull request');
});
