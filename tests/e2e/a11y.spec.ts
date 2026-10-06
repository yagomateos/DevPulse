import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, login, test } from './fixtures';

/** Automated WCAG 2.1 A/AA audit of every main screen, in both themes. */
const PAGES = [
  '/dashboard',
  '/projects',
  '/projects/orion-gateway',
  '/projects/orion-gateway/pull-requests',
  '/projects/orion-gateway/pull-requests/312',
  '/projects/orion-gateway/deployments/128',
  '/projects/orion-gateway/incidents/inc-42',
  '/incidents',
  '/team',
  '/ai',
  '/settings/general',
  '/architecture',
];

async function violations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return results.violations.map((v) => `${label}: [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length}) ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
}

test('login page has no WCAG A/AA violations', async ({ page }) => {
  await page.goto('/login');
  const found = await violations(page, '/login');
  expect(found, found.join('\n')).toEqual([]);
});

for (const scheme of ['dark', 'light'] as const) {
  test(`workspace pages have no WCAG A/AA violations (${scheme})`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setExtraHTTPHeaders({ 'x-mock-network': 'off' });
    if (scheme === 'light') await page.addInitScript(() => localStorage.setItem('aiw-theme', 'light'));
    await login(page);
    const found: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      found.push(...(await violations(page, `${path} (${scheme})`)));
    }
    expect(found, found.join('\n')).toEqual([]);
  });
}
