import { after, NextResponse, type NextRequest } from 'next/server';
import { pullRequestsFromEvent, verifyGitHubSignature } from '@/server/github/webhook';
import { projectsForRepository, syncPullRequest } from '@/server/github/sync';
import { getRepository } from '@/server/repositories';

/**
 * GitHub webhook receiver. Public (listed in the proxy's PUBLIC_PATHS) but
 * authenticated by the HMAC signature. GitHub times out after 10s, so we
 * verify, acknowledge with 202 and run the sync after the response.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: { message: 'GitHub webhooks are not configured.', status: 503 } }, { status: 503 });
  }

  const body = await request.text();
  if (!verifyGitHubSignature(body, request.headers.get('x-hub-signature-256'), secret)) {
    return NextResponse.json({ error: { message: 'Invalid signature.', status: 401 } }, { status: 401 });
  }

  const event = request.headers.get('x-github-event') ?? '';
  const delivery = request.headers.get('x-github-delivery') ?? 'unknown';
  if (event === 'ping') return NextResponse.json({ ok: true, pong: true });

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: { message: 'Body must be JSON.', status: 400 } }, { status: 400 });
  }

  const target = pullRequestsFromEvent(event, payload);
  if (!target) return NextResponse.json({ ok: true, ignored: event }, { status: 202 });

  const repo = await getRepository();
  const { integrations } = await repo.settings.get();
  if (!integrations.github.connected) return NextResponse.json({ ok: true, ignored: 'integration disconnected' }, { status: 202 });

  const projects = await projectsForRepository(repo, target.repository);
  if (!projects.length) return NextResponse.json({ ok: true, ignored: 'no project for repository' }, { status: 202 });

  after(async () => {
    for (const project of projects) {
      for (const number of target.numbers) {
        try {
          await syncPullRequest(repo, project, number);
        } catch (error) {
          // GitHub shows the 202 as delivered; the reconcile cron will pick this PR up again.
          console.error(`[github-webhook] delivery ${delivery}: ${target.repository}#${number} → ${project.id} failed`, error);
        }
      }
    }
  });

  return NextResponse.json({ ok: true, projects: projects.map((p) => p.id), pullRequests: target.numbers }, { status: 202 });
}
