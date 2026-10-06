import { describe, expect, it } from 'vitest';
import type { GhCheckRun, GhPullRequest, GhReview } from './client';
import { mapCheckRun, mapReviewStatus, mapStatus, parsePatch, toPullRequest } from './mapper';

const pr: GhPullRequest = {
  number: 7,
  title: 'Update README',
  body: 'Better description',
  state: 'open',
  draft: false,
  merged_at: null,
  created_at: '2026-10-06T10:00:00Z',
  updated_at: '2026-10-06T11:00:00Z',
  user: { login: 'yagomateos' },
  head: { ref: 'docs/readme', sha: 'abc123' },
  base: { ref: 'main' },
  labels: [{ name: 'docs' }],
  requested_reviewers: [{ login: 'reviewer' }],
  additions: 3,
  deletions: 1,
  changed_files: 1,
};

const review = (login: string, state: GhReview['state'], id = Math.random()): GhReview => ({ id, user: { login }, body: '', state, submitted_at: '2026-10-06T10:30:00Z' });

const check = (overrides: Partial<GhCheckRun>): GhCheckRun => ({
  id: 1,
  name: 'test',
  status: 'completed',
  conclusion: 'success',
  started_at: '2026-10-06T10:00:00Z',
  completed_at: '2026-10-06T10:01:30Z',
  output: { title: null, summary: null },
  ...overrides,
});

describe('parsePatch', () => {
  it('numbers added, removed and context lines per hunk', () => {
    const hunks = parsePatch('@@ -1,3 +1,3 @@\n # XistraCloud\n-old line\n+new line\n context\n\\ No newline at end of file');
    expect(hunks).toHaveLength(1);
    expect(hunks[0]!.lines).toEqual([
      { kind: 'context', content: '# XistraCloud', oldNumber: 1, newNumber: 1 },
      { kind: 'remove', content: 'old line', oldNumber: 2, newNumber: null },
      { kind: 'add', content: 'new line', oldNumber: null, newNumber: 2 },
      { kind: 'context', content: 'context', oldNumber: 3, newNumber: 3 },
    ]);
  });

  it('handles multiple hunks, missing patches and caps huge diffs', () => {
    expect(parsePatch(undefined)).toEqual([]);
    const two = parsePatch('@@ -1 +1 @@\n-a\n+b\n@@ -10,2 +10,2 @@ fn()\n x\n+y');
    expect(two.map((h) => h.lines[0]!.oldNumber ?? h.lines[0]!.newNumber)).toEqual([1, 10]);
    const big = `@@ -1,0 +1,1000 @@\n${Array.from({ length: 1000 }, (_, i) => `+line ${i}`).join('\n')}`;
    expect(parsePatch(big, 50)[0]!.lines).toHaveLength(50);
  });
});

describe('status mapping', () => {
  it('derives PR status from state, draft and merge', () => {
    expect(mapStatus({ state: 'open', draft: false, merged_at: null })).toBe('open');
    expect(mapStatus({ state: 'open', draft: true, merged_at: null })).toBe('draft');
    expect(mapStatus({ state: 'closed', merged_at: '2026-10-06T00:00:00Z' })).toBe('merged');
    expect(mapStatus({ state: 'closed', merged_at: null })).toBe('closed');
  });

  it("uses each reviewer's latest decisive review", () => {
    expect(mapReviewStatus([])).toBe('pending');
    expect(mapReviewStatus([review('a', 'COMMENTED')])).toBe('commented');
    expect(mapReviewStatus([review('a', 'APPROVED'), review('a', 'COMMENTED')])).toBe('approved');
    expect(mapReviewStatus([review('a', 'CHANGES_REQUESTED'), review('a', 'APPROVED')])).toBe('approved');
    expect(mapReviewStatus([review('a', 'APPROVED'), review('b', 'CHANGES_REQUESTED')])).toBe('changes_requested');
  });

  it('maps check run conclusions and durations', () => {
    expect(mapCheckRun(check({}))).toMatchObject({ status: 'success', durationSeconds: 90, summary: 'success' });
    expect(mapCheckRun(check({ conclusion: 'timed_out' })).status).toBe('failed');
    expect(mapCheckRun(check({ conclusion: 'skipped' })).status).toBe('skipped');
    expect(mapCheckRun(check({ status: 'in_progress', conclusion: null, completed_at: null }))).toMatchObject({ status: 'running', durationSeconds: 0 });
  });
});

describe('toPullRequest', () => {
  it('builds a scored aggregate with the seed id convention', () => {
    const result = toPullRequest('xistracloud', {
      pr,
      files: [{ filename: 'README.md', status: 'modified', additions: 3, deletions: 1, patch: '@@ -1 +1,3 @@\n-old\n+new\n+more\n+lines' }],
      commits: [{ sha: 'abc123', commit: { message: 'Update README.md', author: { name: 'Yago', date: '2026-10-06T10:00:00Z' } }, author: { login: 'yagomateos' } }],
      reviews: [review('reviewer', 'APPROVED', 1)],
      reviewComments: [{ id: 2, user: { login: 'reviewer' }, body: 'Typo', created_at: '2026-10-06T10:20:00Z', path: 'README.md', line: 2 }],
      issueComments: [{ id: 3, user: { login: 'yagomateos' }, body: 'Thanks!', created_at: '2026-10-06T10:40:00Z' }],
      checkRuns: [check({ id: 9, name: 'build' }), check({ id: 10, name: 'lint', conclusion: 'failure' })],
    });

    expect(result).toMatchObject({
      id: 'xistracloud#7',
      projectId: 'xistracloud',
      status: 'open',
      reviewStatus: 'approved',
      branch: 'docs/readme',
      baseBranch: 'main',
      filesChanged: 1,
      tests: { passed: 1, failed: 1, skipped: 0 },
      labels: ['docs'],
      reviewers: ['reviewer'],
    });
    expect(result.files[0]!.hunks[0]!.lines.filter((l) => l.kind === 'add')).toHaveLength(3);
    expect(result.comments.map((c) => c.id)).toEqual(['gh-rc-2', 'gh-review-1', 'gh-ic-3']);
    expect(result.riskScore).toBeGreaterThan(0);
    expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
  });
});
