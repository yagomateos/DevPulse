import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routerMock } from '../../../../tests/setup/next-navigation-mock';
import { AcceptInvitationForm } from './accept-invitation-form';

const acceptInvitationAction = vi.fn();
vi.mock('../actions', () => ({ acceptInvitationAction: (...args: unknown[]) => acceptInvitationAction(...args) }));

const fill = async (password: string, confirm: string) => {
  const user = userEvent.setup();
  render(<AcceptInvitationForm token="tok_123" email="sam@example.com" />);
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText('Confirm password'), confirm);
  await user.click(screen.getByRole('button', { name: 'Join workspace' }));
};

describe('AcceptInvitationForm', () => {
  beforeEach(() => acceptInvitationAction.mockReset());

  it('enforces the password policy before calling the server', async () => {
    await fill('short', 'different');
    expect(await screen.findByText('Use at least 10 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(acceptInvitationAction).not.toHaveBeenCalled();
  });

  it('joins and lands on the dashboard', async () => {
    acceptInvitationAction.mockResolvedValue({ ok: true, redirectTo: '/dashboard' });
    await fill('Sam-password-42', 'Sam-password-42');
    await vi.waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/dashboard'));
    expect(acceptInvitationAction).toHaveBeenCalledWith('tok_123', { password: 'Sam-password-42', confirmPassword: 'Sam-password-42' });
  });

  it('explains a link that stopped working', async () => {
    acceptInvitationAction.mockResolvedValue({ ok: false, error: 'This invitation has expired. Ask your admin to send a new one.' });
    await fill('Sam-password-42', 'Sam-password-42');
    expect(await screen.findByRole('alert')).toHaveTextContent('This invitation has expired');
  });
});
