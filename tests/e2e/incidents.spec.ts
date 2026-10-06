import { expect, test } from './fixtures';

test('declares an incident from the command palette and updates its status', async ({ authed: page }) => {
  await page.goto('/projects/atlas-web');
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('option', { name: 'Create incident' }).click();
  const dialog = page.getByRole('dialog', { name: 'Declare an incident' });
  await dialog.getByRole('button', { name: 'Declare incident' }).click();
  await expect(dialog.getByText(/at least 8 characters/)).toBeVisible();

  await dialog.getByLabel('Title').fill('Checkout requests timing out');
  await dialog.getByLabel('Affected service').click();
  await page.getByRole('option', { name: 'web-app' }).click();
  await dialog.getByLabel(/what’s happening/i).fill('Checkout POST requests exceed 30 seconds for EU users.');
  await dialog.getByRole('button', { name: 'Declare incident' }).click();

  await expect(page).toHaveURL(/\/projects\/atlas-web\/incidents\/inc-\d+/);
  await expect(page.getByRole('heading', { name: 'Checkout requests timing out' })).toBeVisible();
  await page.getByLabel('Status').click();
  await page.getByRole('option', { name: 'Monitoring' }).click();
  await page.getByRole('button', { name: 'Update incident' }).click();
  await expect(page.getByText('Status changed to monitoring').first()).toBeVisible();
});

test('investigates an incident with AI', async ({ authed: page }) => {
  await page.goto('/projects/orion-gateway/incidents/inc-42');
  await page.getByRole('button', { name: 'Investigate with AI' }).click();
  await expect(page.getByText('Likely cause')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('link', { name: /deployment #128 preceded/i })).toBeVisible();
});
