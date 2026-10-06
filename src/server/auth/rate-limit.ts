import 'server-only';

/**
 * Fixed-window limiter for failed sign-ins, keyed by email + client IP.
 * In-memory (per instance) — enough for a single-node deployment; swap for
 * Redis/Upstash when running multiple instances.
 */
const WINDOW_MS = 60_000;
const MAX_FAILURES = 5;

interface Bucket {
  failures: number;
  resetAt: number;
}

const store = globalThis as unknown as { __aiwLoginBuckets?: Map<string, Bucket> };
const buckets = () => (store.__aiwLoginBuckets ??= new Map());

export function checkLoginAllowed(key: string, now = Date.now()): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const bucket = buckets().get(key);
  if (!bucket || bucket.resetAt <= now || bucket.failures < MAX_FAILURES) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}

export function recordLoginFailure(key: string, now = Date.now()) {
  const bucket = buckets().get(key);
  if (!bucket || bucket.resetAt <= now) buckets().set(key, { failures: 1, resetAt: now + WINDOW_MS });
  else bucket.failures += 1;
}

export function clearLoginFailures(key: string) {
  buckets().delete(key);
}

/** Test helper. */
export function resetLoginRateLimit() {
  buckets().clear();
}
