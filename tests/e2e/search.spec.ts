import { expect, test } from './fixtures';

test('global search finds records and navigates with the keyboard', async ({ authed: page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Search the workspace' }).click();
  await page.getByRole('combobox', { name: 'Command or search' }).fill('auth');
  await expect(page.getByRole('group', { name: 'Pull Requests' })).toBeVisible();
  await expect(page.locator('mark', { hasText: /auth/i }).first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Command or search' }).fill('INC-42');
  await expect(page.getByRole('option', { name: /authentication timeouts/i })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/incidents\/inc-42/);
});

test('shows an empty state for unknown terms', async ({ authed: page }) => {
  await page.goto('/dashboard');
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('combobox', { name: 'Command or search' }).fill('zzzzqqq');
  await expect(page.getByText(/no results for/i)).toBeVisible();
});
