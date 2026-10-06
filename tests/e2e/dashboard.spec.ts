import { expect, test } from './fixtures';

test('dashboard filters update the URL and metrics drill down', async ({ authed: page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('region', { name: 'Key metrics' })).toBeVisible();
  await page.getByRole('radio', { name: 'Last 30d' }).click();
  await expect(page).toHaveURL(/range=30d/);
  await page.getByRole('tab', { name: 'Reliability' }).click();
  await expect(page).toHaveURL(/tab=reliability/);
  await page.getByRole('link', { name: /^active incidents:/i }).click();
  await expect(page).toHaveURL(/\/incidents\?status=investigating,identified,monitoring/);
  await expect(page.getByRole('table', { name: 'Incidents' })).toBeVisible();
});
