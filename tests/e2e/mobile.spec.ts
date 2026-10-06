import { expect, test } from './fixtures';

test('mobile uses drawer navigation and card lists', async ({ authed: page }) => {
  await page.goto('/pull-requests');
  await expect(page.getByRole('table', { name: 'Pull requests' })).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Pull requests' })).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Incidents', exact: true }).click();
  await expect(page).toHaveURL(/\/incidents$/);
});
