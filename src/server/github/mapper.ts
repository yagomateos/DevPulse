import type { CheckRun, CheckStatus, Commit, DiffHunk, FileChange, FileChangeStatus, PullRequest, PullRequestStatus, ReviewComment, ReviewStatus } from '@/types/domain';
import { analyzePullRequestHeuristic } from '../ai/heuristics';
import type { GhCheckRun, GhCommit, GhFile, GhIssueComment, GhPullRequest, GhReview, GhReviewComment } from './client';

/**
 * Pure translation from GitHub REST payloads to the app's PullRequest
 * aggregate. No I/O here, so it is exhaustively unit-tested.
 */

/** Keeps JSONB rows bounded: huge generated diffs add nothing to review risk. */
const MAX_PATCH_LINES_PER_FILE = 400;

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parsePatch(patch: string | undefined, maxLines = MAX_PATCH_LINES_PER_FILE): DiffHunk[] {
  if (!patch) return [];
  const hunks: DiffHunk[] = [];
  let current: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;
  let emitted = 0;

  for (const raw of patch.split('\n')) {
    const header = HUNK_HEADER.exec(raw);
    if (header) {
      current = { header: raw, lines: [] };
      hunks.push(current);
      oldLine = Number(header[1]);
      newLine = Number(header[2]);
      continue;
    }
    if (!current || raw.startsWith('\\')) continue; // "\ No newline at end of file"
    if (emitted >= maxLines) break;
    emitted++;
    if (raw.startsWith('+')) current.lines.push({ kind: 'add', content: raw.slice(1), oldNumber: null, newNumber: newLine++ });
    else if (raw.startsWith('-')) current.lines.push({ kind: 'remove', content: raw.slice(1), oldNumber: oldLine++, newNumber: null });
    else current.lines.push({ kind: 'context', content: raw.slice(1), oldNumber: oldLine++, newNumber: newLine++ });
  }
  return hunks;
}

const FILE_STATUS: Record<GhFile['status'], FileChangeStatus> = {
  added: 'added',
  copied: 'added',
  removed: 'deleted',
  renamed: 'renamed',
  modified: 'modified',
  changed: 'modified',
  unchanged: 'modified',
};

export function mapStatus(pr: Pick<GhPullRequest, 'state' | 'draft' | 'merged_at'>): PullRequestStatus {
  if (pr.merged_at) return 'merged';
  if (pr.state === 'closed') return 'closed';
  return pr.draft ? 'draft' : 'open';
}

/** GitHub semantics: each reviewer's latest decisive review counts; any outstanding "changes requested" wins. */
export function mapReviewStatus(reviews: GhReview[]): ReviewStatus {
  const latest = new Map<string, GhReview['state']>();
  for (const review of reviews) {
    const who = review.user?.login ?? 'ghost';
    if (review.state === 'COMMENTED' && latest.has(who)) continue;
    latest.set(who, review.state);
  }
  const states = [...latest.values()];
  if (states.includes('CHANGES_REQUESTED')) return 'changes_requested';
  if (states.includes('APPROVED')) return 'approved';
  if (states.includes('COMMENTED')) return 'commented';
  return 'pending';
}

export function mapCheckRun(run: GhCheckRun): CheckRun {
  let status: CheckStatus;
  if (run.status !== 'completed') status = 'running';
  else if (run.conclusion === 'success') status = 'success';
  else if (run.conclusion === 'skipped' || run.conclusion === 'neutral' || run.conclusion === 'stale') status = 'skipped';
  else status = 'failed';
  const started = run.started_at ? Date.parse(run.started_at) : NaN;
  const finished = run.completed_at ? Date.parse(run.completed_at) : NaN;
  return {
    id: `gh-check-${run.id}`,
    name: run.name,
    status,
    durationSeconds: Number.isFinite(started) && Number.isFinite(finished) ? Math.max(0, Math.round((finished - started) / 1000)) : 0,
    summary: run.output.title ?? run.output.summary?.slice(0, 280) ?? run.conclusion ?? run.status,
  };
}

export interface GitHubPullRequestBundle {
  pr: GhPullRequest;
  files: GhFile[];
  commits: GhCommit[];
  reviews: GhReview[];
  reviewComments: GhReviewComment[];
  issueComments: GhIssueComment[];
  checkRuns: GhCheckRun[];
}

export function toPullRequest(projectId: string, bundle: GitHubPullRequestBundle): PullRequest {
  const { pr, files, commits, reviews, reviewComments, issueComments, checkRuns } = bundle;
  const login = (u: { login: string } | null) => u?.login ?? 'ghost';

  const fileChanges: FileChange[] = files.map((f) => ({
    path: f.filename,
    status: FILE_STATUS[f.status],
    additions: f.additions,
    deletions: f.deletions,
    hunks: parsePatch(f.patch),
  }));

  const commitList: Commit[] = commits.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    author: c.author?.login ?? c.commit.author?.name ?? 'unknown',
    committedAt: c.commit.author?.date ?? pr.updated_at,
    // Per-commit stats need one extra request per commit; not worth the rate limit.
    additions: 0,
    deletions: 0,
  }));

  const comments: ReviewComment[] = [
    ...reviews
      .filter((r) => r.state === 'APPROVED' || r.state === 'CHANGES_REQUESTED' || (r.state === 'COMMENTED' && r.body))
      .map(
        (r): ReviewComment => ({
          id: `gh-review-${r.id}`,
          author: login(r.user),
          body: r.body || (r.state === 'APPROVED' ? 'Approved these changes' : 'Requested changes'),
          createdAt: r.submitted_at ?? pr.updated_at,
          kind: r.state === 'APPROVED' ? 'approval' : r.state === 'CHANGES_REQUESTED' ? 'changes_requested' : 'comment',
        }),
      ),
    ...reviewComments.map(
      (c): ReviewComment => ({ id: `gh-rc-${c.id}`, author: login(c.user), body: c.body, createdAt: c.created_at, kind: 'comment', path: c.path, ...(c.line ? { line: c.line } : {}) }),
    ),
    ...issueComments.map((c): ReviewComment => ({ id: `gh-ic-${c.id}`, author: login(c.user), body: c.body, createdAt: c.created_at, kind: 'comment' })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const checks = checkRuns.map(mapCheckRun);
  const reviewers = [...new Set([...(pr.requested_reviewers ?? []).map(login), ...reviews.map((r) => login(r.user))])].filter((r) => r !== login(pr.user));

  const draft: PullRequest = {
    id: `${projectId}#${pr.number}`,
    projectId,
    number: pr.number,
    title: pr.title,
    author: login(pr.user),
    status: mapStatus(pr),
    reviewStatus: mapReviewStatus(reviews),
    branch: pr.head.ref,
    baseBranch: pr.base.ref,
    filesChanged: pr.changed_files ?? files.length,
    additions: pr.additions ?? files.reduce((n, f) => n + f.additions, 0),
    deletions: pr.deletions ?? files.reduce((n, f) => n + f.deletions, 0),
    // GitHub exposes check runs, not test counts; each check stands in for a suite.
    tests: {
      passed: checks.filter((c) => c.status === 'success').length,
      failed: checks.filter((c) => c.status === 'failed').length,
      skipped: checks.filter((c) => c.status === 'skipped').length,
    },
    riskScore: 0,
    riskLevel: 'low',
    labels: pr.labels.map((l) => l.name),
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    description: pr.body ?? '',
    reviewers,
    commits: commitList,
    files: fileChanges,
    checks,
    comments,
  };

  // Same deterministic analyser the demo data and the AI fallback use, so scores are comparable.
  const { riskScore, riskLevel } = analyzePullRequestHeuristic(draft);
  return { ...draft, riskScore, riskLevel };
}
