import { beforeEach, describe, expect, it } from 'vitest';
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure, resetLoginRateLimit } from './rate-limit';

describe('login rate limiting', () => {
  beforeEach(() => resetLoginRateLimit());

  it('blocks after five failures within the window and reports the wait', () => {
    const now = 1_000_000;
    for (let i = 0; i < 4; i++) recordLoginFailure('a@x|ip', now);
    expect(checkLoginAllowed('a@x|ip', now).allowed).toBe(true);
    recordLoginFailure('a@x|ip', now);
    expect(checkLoginAllowed('a@x|ip', now + 10_000)).toEqual({ allowed: false, retryAfterSeconds: 50 });
  });

  it('isolates keys and resets after the window or a successful login', () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) recordLoginFailure('a@x|ip', now);
    expect(checkLoginAllowed('b@x|ip', now).allowed).toBe(true);
    expect(checkLoginAllowed('a@x|ip', now + 61_000).allowed).toBe(true);
    clearLoginFailures('a@x|ip');
    expect(checkLoginAllowed('a@x|ip', now).allowed).toBe(true);
  });
});
