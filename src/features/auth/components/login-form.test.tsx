import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routerMock } from '../../../../tests/setup/next-navigation-mock';
import { createTestQueryClient } from '../../../../tests/setup/render';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './login-form';

const login = vi.fn();
vi.mock('../actions', () => ({ login: (...args: unknown[]) => login(...args) }));

const renderForm = (demoMode: boolean) =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <LoginForm demoMode={demoMode} next="/projects/orion-gateway" />
    </QueryClientProvider>,
  );

describe('LoginForm', () => {
  beforeEach(() => login.mockReset());

  it('in demo mode lets you pick a role and redirects back after success', async () => {
    login.mockResolvedValue({ ok: true, redirectTo: '/projects/orion-gateway' });
    const user = userEvent.setup();
    renderForm(true);
    await user.click(screen.getByRole('radio', { name: 'Developer' }));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await vi.waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/projects/orion-gateway'));
    expect(login).toHaveBeenCalledWith({ email: 'demo@example.com', password: 'demo123', role: 'DEVELOPER' }, '/projects/orion-gateway');
  });

  it('outside demo mode hides the role picker and the prefilled credentials', () => {
    renderForm(false);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('');
  });

  it('shows validation and server errors', async () => {
    login.mockResolvedValue({ ok: false, error: 'Too many failed attempts. Try again in 42s.' });
    const user = userEvent.setup();
    renderForm(false);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Email'), 'demo@example.com');
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'x');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/too many failed attempts/i)).toBeInTheDocument();
  });
});
