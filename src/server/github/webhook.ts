import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies GitHub's `X-Hub-Signature-256` header (HMAC-SHA256 of the raw
 * body with the shared webhook secret). Constant-time comparison; any
 * malformed input is simply "not valid".
 */
export function verifyGitHubSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature?.startsWith('sha256=')) return false;
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')}`);
  const received = Buffer.from(signature);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Narrows a webhook delivery to the pull requests it affects. Returns null for
 * events we don't track, so the route can acknowledge and ignore them.
 */
export function pullRequestsFromEvent(event: string, payload: unknown): { repository: string; numbers: number[] } | null {
  const p = payload as {
    repository?: { full_name?: string };
    pull_request?: { number?: number };
    issue?: { number?: number; pull_request?: unknown };
    check_suite?: { pull_requests?: { number: number }[] };
    check_run?: { pull_requests?: { number: number }[] };
  };
  const repository = p.repository?.full_name;
  if (!repository) return null;

  let numbers: number[] = [];
  switch (event) {
    case 'pull_request':
    case 'pull_request_review':
    case 'pull_request_review_comment':
    case 'pull_request_review_thread':
      numbers = p.pull_request?.number ? [p.pull_request.number] : [];
      break;
    case 'issue_comment':
      // Issue comments fire for issues too; only PR conversations matter.
      numbers = p.issue?.pull_request && p.issue.number ? [p.issue.number] : [];
      break;
    case 'check_suite':
      numbers = p.check_suite?.pull_requests?.map((x) => x.number) ?? [];
      break;
    case 'check_run':
      numbers = p.check_run?.pull_requests?.map((x) => x.number) ?? [];
      break;
    default:
      return null;
  }
  return numbers.length ? { repository, numbers: [...new Set(numbers)] } : null;
}
