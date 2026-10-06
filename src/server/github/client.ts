import 'server-only';

/**
 * Minimal typed GitHub REST client (fetch-based, no SDK). Only the endpoints
 * the pull-request sync needs. Authenticates with GITHUB_TOKEN when set — a
 * fine-grained token with read access to Pull requests and Checks is enough.
 * Without a token public repositories still work, but GitHub caps anonymous
 * clients at 60 requests/hour.
 */

const API = 'https://api.github.com';
const TIMEOUT_MS = 10_000;

export class GitHubError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

/* -------------------------------------------------------------------------- */
/* Response shapes (only the fields we read)                                  */
/* -------------------------------------------------------------------------- */

export interface GhUser {
  login: string;
}

export interface GhPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  draft?: boolean;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  user: GhUser | null;
  head: { ref: string; sha: string };
  base: { ref: string };
  labels: { name: string }[];
  requested_reviewers?: GhUser[];
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface GhFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface GhCommit {
  sha: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author: GhUser | null;
}

export interface GhReview {
  id: number;
  user: GhUser | null;
  body: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at?: string;
}

export interface GhReviewComment {
  id: number;
  user: GhUser | null;
  body: string;
  created_at: string;
  path: string;
  line: number | null;
}

export interface GhIssueComment {
  id: number;
  user: GhUser | null;
  body: string;
  created_at: string;
}

export interface GhCheckRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'stale' | null;
  started_at: string | null;
  completed_at: string | null;
  output: { title: string | null; summary: string | null };
}

/* -------------------------------------------------------------------------- */
/* Transport                                                                  */
/* -------------------------------------------------------------------------- */

async function request<T>(path: string, token = process.env.GITHUB_TOKEN): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'devpulse',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.ok) return (await response.json()) as T;

  if ((response.status === 403 || response.status === 429) && response.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
    throw new GitHubError(429, `GitHub rate limit exceeded${reset ? ` until ${new Date(reset).toISOString()}` : ''}${token ? '' : ' (set GITHUB_TOKEN to raise it)'}`);
  }
  const detail = await response
    .json()
    .then((b: { message?: string }) => b.message)
    .catch(() => undefined);
  throw new GitHubError(response.status, `GitHub ${response.status} on ${path}${detail ? `: ${detail}` : ''}`);
}

/** Follows page numbers until a short page or `maxPages`, whichever comes first. */
async function paginate<T>(path: string, maxPages: number): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = await request<T[]>(`${path}${sep}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

/** "Owner/Repo" → URL-safe path segment, validated so it can't escape the repos/ namespace. */
export function repoPath(fullName: string) {
  const [owner, name, ...rest] = fullName.split('/');
  if (!owner || !name || rest.length) throw new GitHubError(400, `Invalid repository "${fullName}"`);
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export const github = {
  pullRequest: (repo: string, number: number) => request<GhPullRequest>(`${repoPath(repo)}/pulls/${number}`),
  /** Most recently updated pull requests, any state. */
  recentPullRequests: (repo: string, limit: number) =>
    request<GhPullRequest[]>(`${repoPath(repo)}/pulls?state=all&sort=updated&direction=desc&per_page=${Math.min(limit, 100)}`),
  files: (repo: string, number: number) => paginate<GhFile>(`${repoPath(repo)}/pulls/${number}/files`, 3),
  commits: (repo: string, number: number) => paginate<GhCommit>(`${repoPath(repo)}/pulls/${number}/commits`, 1),
  reviews: (repo: string, number: number) => paginate<GhReview>(`${repoPath(repo)}/pulls/${number}/reviews`, 1),
  reviewComments: (repo: string, number: number) => paginate<GhReviewComment>(`${repoPath(repo)}/pulls/${number}/comments`, 1),
  issueComments: (repo: string, number: number) => paginate<GhIssueComment>(`${repoPath(repo)}/issues/${number}/comments`, 1),
  checkRuns: (repo: string, sha: string) =>
    request<{ check_runs: GhCheckRun[] }>(`${repoPath(repo)}/commits/${encodeURIComponent(sha)}/check-runs?per_page=100`).then((r) => r.check_runs),
};
