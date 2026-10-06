import type { FullConfig } from '@playwright/test';

/** Resets the demo data before the suite so every run starts from the same state. */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3000';
  const response = await fetch(`${baseURL}/api/test/reset`, {
    method: 'POST',
    headers: { 'x-test-reset-token': process.env.TEST_RESET_TOKEN ?? 'e2e-reset-token' },
  });
  if (!response.ok) throw new Error(`Could not reset demo data before E2E run (${response.status})`);
}
