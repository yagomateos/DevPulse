import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { syncProject } from '@/server/github/sync';
import { getRepository } from '@/server/repositories';

export const maxDuration = 300;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get('authorization') ?? '');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Reconcile job (Vercel Cron, see vercel.json). Webhooks are the primary
 * path; this catches anything they missed — failed deliveries, events sent
 * before the webhook existed, or check runs that finished without one.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: { message: 'Unauthorized.', status: 401 } }, { status: 401 });
  }
  const repo = await getRepository();
  const { integrations } = await repo.settings.get();
  if (!integrations.github.connected) return NextResponse.json({ ok: true, skipped: 'integration disconnected' });

  const projects = (await repo.projects.list()).filter((p) => p.status !== 'archived');
  const results = [];
  // Sequential on purpose: projects share one GitHub rate limit.
  for (const project of projects) results.push(await syncProject(repo, project));
  return NextResponse.json({ ok: true, results });
}
