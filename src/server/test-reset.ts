import 'server-only';
import { createDataset } from './data/dataset';
import { resetLoginRateLimit } from './auth/rate-limit';
import { resetPasswords } from './auth/credentials';
import { resetMemoryStore } from './repositories/memory-repository';

/**
 * Restores the pristine demo dataset: keeps end-to-end runs isolated and lets
 * the public demo refresh itself daily (Vercel Cron). Only reachable in
 * development, with TEST_RESET_TOKEN (CI), or with the Vercel CRON_SECRET.
 */
export function isResetAllowed(token: string | null, authorization: string | null = null) {
  if (process.env.NODE_ENV !== 'production') return true;
  const expected = process.env.TEST_RESET_TOKEN;
  if (expected && token === expected) return true;
  const cronSecret = process.env.CRON_SECRET;
  return !!cronSecret && authorization === `Bearer ${cronSecret}`;
}

/**
 * `keepUserProjects` (the daily cron) only refreshes the demo projects and keeps
 * the ones people created, e.g. real repositories synced from GitHub. Test runs
 * use the full reset so every run starts from the exact same dataset. The
 * in-memory store is ephemeral anyway and always resets fully.
 */
export async function resetAllData({ keepUserProjects = false } = {}) {
  resetLoginRateLimit();
  resetPasswords();
  if (process.env.DATA_SOURCE === 'postgres') {
    const [{ getDb }, { seedDatabase, refreshDemoData }] = await Promise.all([import('./db/client'), import('./db/seed-data')]);
    await (keepUserProjects ? refreshDemoData : seedDatabase)(getDb(), createDataset());
  } else {
    resetMemoryStore();
  }
}
