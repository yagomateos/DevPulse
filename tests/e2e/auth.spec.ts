import { expect, login, test } from './fixtures';

test.describe('authentication', () => {
  test('redirects anonymous users to login and back after sign-in', async ({ page }) => {
    await page.goto('/projects/orion-gateway');
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects%2Forion-gateway/);
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password', { exact: true }).fill('demo123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/projects\/orion-gateway$/);
    await expect(page.getByRole('heading', { name: 'Orion API Gateway' })).toBeVisible();
  });

  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Password', { exact: true }).fill('wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('rejects API calls without a session', async ({ request }) => {
    const res = await request.get('/api/projects');
    expect(res.status()).toBe(401);
  });

  test('signs out from the user menu', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /account menu/i }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('hides admin actions for developers (RBAC)', async ({ page }) => {
    await login(page, 'DEVELOPER', '/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('button', { name: /new project/i })).toHaveCount(0);
    const res = await page.request.post('/api/projects', { data: { name: 'Nope', repository: 'acme/nope', defaultBranch: 'main', language: 'Go' } });
    expect(res.status()).toBe(403);
  });
});
