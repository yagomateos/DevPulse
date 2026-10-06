import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AI_ANALYSIS_KINDS } from '@/schemas/ai';
import { runAnalysis } from '@/server/ai/analyze';
import { requirePermission, requireSession } from '@/server/auth/session';
import { parseBody, parseSearchParams, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

const targetSchema = z.object({
  kind: z.enum(AI_ANALYSIS_KINDS),
  projectId: z.string().min(1),
  key: z.string().min(1),
});

/** Structured AI analysis of a PR, deployment or incident. */
export const POST = route(
  async (request) => {
    await requirePermission('ai:analyze');
    const target = await parseBody(request, targetSchema);
    return NextResponse.json(await runAnalysis(await getRepository(), target));
  },
  { simulate: false },
);

/** Latest stored analysis for a target (null when never analysed). */
export const GET = route(async (request) => {
  await requireSession();
  const { kind, projectId, key } = parseSearchParams(request, targetSchema);
  const targetId = kind === 'pull_request' ? `${projectId}#${key}` : kind === 'deployment' ? `${projectId}~${key}` : key;
  return NextResponse.json(await (await getRepository()).aiAnalyses.latest(kind, targetId));
});
