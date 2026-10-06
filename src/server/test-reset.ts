import 'server-only';
import { createDataset } from './data/dataset';
import { resetLoginRateLimit } from './auth/rate-limit';
import { resetPasswords } from './auth/credentials';
import { resetMemoryStore } from './repositories/memory-repository';

/**
 * Restores the pristine demo dataset so end-to-end runs are isolated and
 * repeatable. Only reachable in development, or in a production build when
 * TEST_RESET_TOKEN is configured (CI) and the request carries it.
 */
export function isResetAllowed(token: string | null) {
  if (process.env.NODE_ENV !== 'production') return true;
  const expected = process.env.TEST_RESET_TOKEN;
  return !!expected && token === expected;
}

export async function resetAllData() {
  resetLoginRateLimit();
  resetPasswords();
  if (process.env.DATA_SOURCE === 'postgres') {
    const [{ getDb }, { seedDatabase }] = await Promise.all([import('./db/client'), import('./db/seed-data')]);
    await seedDatabase(getDb(), createDataset());
  } else {
    resetMemoryStore();
  }
}
