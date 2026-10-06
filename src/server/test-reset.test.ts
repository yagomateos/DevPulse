import { afterEach, describe, expect, it, vi } from 'vitest';
import { isResetAllowed } from './test-reset';

describe('test data reset guard', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is always available outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isResetAllowed(null)).toBe(true);
  });

  it('requires a configured, matching token in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TEST_RESET_TOKEN', '');
    expect(isResetAllowed('anything')).toBe(false);
    vi.stubEnv('TEST_RESET_TOKEN', 's3cret');
    expect(isResetAllowed('wrong')).toBe(false);
    expect(isResetAllowed('s3cret')).toBe(true);
  });
});

describe('cron refresh', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('accepts the Vercel CRON_SECRET bearer token in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TEST_RESET_TOKEN', '');
    vi.stubEnv('CRON_SECRET', 'cron-123');
    expect(isResetAllowed(null, 'Bearer cron-123')).toBe(true);
    expect(isResetAllowed(null, 'Bearer nope')).toBe(false);
    expect(isResetAllowed(null, null)).toBe(false);
  });
});
