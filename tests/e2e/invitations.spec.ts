import { expect, test } from './fixtures';

/**
 * The whole invitation journey across two browsers: an admin invites, the
 * invitee opens the link, sets a password, gets in, and can sign in again.
 * No RESEND_API_KEY in the test server, so the UI must offer the link instead.
 */
test('an invited teammate sets a password, joins, and can sign in again', async ({ authed: admin, browser }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await admin.goto('/team');
  await admin.getByRole('button', { name: /invite/i }).first().click();
  const dialog = admin.getByRole('dialog', { name: 'Invite a teammate' });
  await dialog.getByLabel('Name').fill('Riley Invitee');
  await dialog.getByLabel('Work email').fill(email);
  const created = admin.waitForResponse((r) => r.url().endsWith('/api/team') && r.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Send invitation' }).click();
  const { invitation } = await (await created).json();
  await expect(admin.getByText('Invitation created, but the email was not sent')).toBeVisible();
  await expect(admin.getByRole('row', { name: /Riley Invitee/ })).toContainText('Invited');

  const invitee = await (await browser.newContext()).newPage();
  await invitee.goto(invitation.link);
  await expect(invitee.getByRole('heading', { name: 'Join the workspace' })).toBeVisible();
  await expect(invitee.getByText(email)).toBeVisible();
  await invitee.getByLabel('Password', { exact: true }).fill('Riley-password-42');
  await invitee.getByLabel('Confirm password').fill('Riley-password-42');
  await invitee.getByRole('button', { name: 'Join workspace' }).click();
  await expect(invitee).toHaveURL(/\/dashboard$/);

  // The link is single-use.
  await invitee.goto(invitation.link);
  await expect(invitee.getByText('This invitation was already used')).toBeVisible();

  // The new password is a real credential.
  await invitee.context().clearCookies();
  await invitee.goto('/login');
  await invitee.getByLabel('Email').fill(email);
  await invitee.getByLabel('Password', { exact: true }).fill('Riley-password-42');
  await invitee.getByRole('button', { name: 'Sign in' }).click();
  await expect(invitee).not.toHaveURL(/\/login/);

  await admin.reload();
  await expect(admin.getByRole('row', { name: /Riley Invitee/ })).toContainText('Active');
});

test('a tampered invitation link is rejected', async ({ page }) => {
  await page.goto(`/invite/${'x'.repeat(43)}`);
  await expect(page.getByText('This invitation link is not valid')).toBeVisible();
});
