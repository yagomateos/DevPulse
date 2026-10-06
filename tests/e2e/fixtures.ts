import { expect, test as base, type Page } from '@playwright/test';

export async function login(page: Page, role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' = 'ADMIN', next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password', { exact: true }).fill('demo123');
  await page.getByText(role.charAt(0) + role.slice(1).toLowerCase(), { exact: true }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export const test = base.extend<{ authed: Page }>({
  // Named `provide` (not `use`) so the React hooks lint rule does not misfire.
  authed: async ({ page }, provide) => {
    // Skip the simulated network latency for speed.
    await page.setExtraHTTPHeaders({ 'x-mock-network': 'off' });
    await login(page);
    await provide(page);
  },
});

export { expect };
