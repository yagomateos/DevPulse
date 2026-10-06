import { expect, test } from './fixtures';

/** The recruiter journey: dashboard → project → PR → AI review → deployment → performance → Ask AI. */
test('end-to-end demo flow', async ({ authed: page }) => {
  await page.goto('/projects');
  await page.getByRole('link', { name: /orion api gateway/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Orion API Gateway' })).toBeVisible();

  await page.getByRole('navigation', { name: 'Project sections' }).getByRole('link', { name: /pull requests/i }).click();
  await expect(page).toHaveURL(/\/projects\/orion-gateway\/pull-requests/);
  await page.getByRole('searchbox', { name: /search title/i }).fill('312');
  await page.getByRole('link', { name: /fix authentication bypass/i }).click();
  await expect(page.getByRole('heading', { name: /fix authentication bypass/i })).toBeVisible();

  // Accept a previous run's stored analysis on a reused dev server.
  await page.getByRole('button', { name: /analyze with ai|re-run analysis/i }).click();
  await expect(page.getByRole('img', { name: /risk score \d+ of 100/i })).toBeVisible({ timeout: 20_000 });
  const findings = page.getByRole('region', { name: 'Findings' });
  await expect(findings.getByRole('heading', { name: 'Global lock on the request hot path' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Recommendations' })).toBeVisible();

  await page.getByRole('link', { name: /#128/ }).click();
  await expect(page.getByRole('heading', { name: 'Deployment #128' })).toBeVisible();
  await page.getByRole('tab', { name: 'Performance' }).click();
  await expect(page.getByRole('table', { name: /performance before and after/i })).toBeVisible();

  await page.getByRole('button', { name: /analyze deployment|re-run analysis/i }).click();
  await expect(page.getByText('Possible cause')).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Ask AI' }).first().click();
  const panel = page.getByRole('dialog', { name: 'Ask AI' });
  await expect(panel).toBeVisible();
  await expect(panel.getByText('Deployment #128').first()).toBeVisible();
  await expect(panel.getByText('Sources')).toBeVisible({ timeout: 20_000 });
});
