import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { pullRequestsFromEvent, verifyGitHubSignature } from './webhook';

const secret = 'whsec_test';
const sign = (body: string, key = secret) => `sha256=${createHmac('sha256', key).update(body).digest('hex')}`;

describe('verifyGitHubSignature', () => {
  const body = JSON.stringify({ action: 'opened' });

  it('accepts a correctly signed body', () => {
    expect(verifyGitHubSignature(body, sign(body), secret)).toBe(true);
  });

  it('rejects missing, malformed, wrong-key and tampered signatures', () => {
    expect(verifyGitHubSignature(body, null, secret)).toBe(false);
    expect(verifyGitHubSignature(body, 'sha1=abc', secret)).toBe(false);
    expect(verifyGitHubSignature(body, 'sha256=short', secret)).toBe(false);
    expect(verifyGitHubSignature(body, sign(body, 'other'), secret)).toBe(false);
    expect(verifyGitHubSignature(`${body} `, sign(body), secret)).toBe(false);
  });
});

describe('pullRequestsFromEvent', () => {
  const repository = { full_name: 'yagomateos/XistraCloud' };

  it('extracts PR numbers from PR, review and check events', () => {
    expect(pullRequestsFromEvent('pull_request', { repository, pull_request: { number: 4 } })).toEqual({ repository: repository.full_name, numbers: [4] });
    expect(pullRequestsFromEvent('pull_request_review', { repository, pull_request: { number: 5 } })?.numbers).toEqual([5]);
    expect(pullRequestsFromEvent('check_suite', { repository, check_suite: { pull_requests: [{ number: 1 }, { number: 1 }, { number: 2 }] } })?.numbers).toEqual([1, 2]);
  });

  it('only treats issue comments on pull requests as PR activity', () => {
    expect(pullRequestsFromEvent('issue_comment', { repository, issue: { number: 3, pull_request: {} } })?.numbers).toEqual([3]);
    expect(pullRequestsFromEvent('issue_comment', { repository, issue: { number: 3 } })).toBeNull();
  });

  it('ignores untracked events and payloads without a repository', () => {
    expect(pullRequestsFromEvent('push', { repository })).toBeNull();
    expect(pullRequestsFromEvent('pull_request', { pull_request: { number: 1 } })).toBeNull();
    expect(pullRequestsFromEvent('check_run', { repository, check_run: { pull_requests: [] } })).toBeNull();
  });
});
