import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDialogStore } from '@/stores/dialog-store';
import { mockFetch } from '../../../tests/setup/fetch-mock';
import { routerMock } from '../../../tests/setup/next-navigation-mock';
import { renderWithProviders } from '../../../tests/setup/render';
import { CommandPalette } from './command-palette';

const renderPalette = (role: 'ADMIN' | 'DEVELOPER' = 'ADMIN') =>
  renderWithProviders(
    <ThemeProvider attribute="class">
      <CommandPalette />
    </ThemeProvider>,
    { role },
  );

describe('CommandPalette', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useDialogStore.getState().closeDialog();
  });

  it('opens with ⌘K / Ctrl+K and navigates with the keyboard', async () => {
    mockFetch({ 'GET /api/search': [] });
    const user = userEvent.setup();
    renderPalette();
    await user.keyboard('{Control>}k{/Control}');
    const input = await screen.findByRole('combobox', { name: 'Command or search' });
    await user.type(input, 'go to proj');
    await user.keyboard('{Enter}');
    expect(routerMock.push).toHaveBeenCalledWith('/projects');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens global dialogs from commands', async () => {
    mockFetch({ 'GET /api/search': [] });
    const user = userEvent.setup();
    renderPalette();
    await user.keyboard('{Control>}k{/Control}');
    await user.click(await screen.findByRole('option', { name: /create incident/i }));
    expect(useDialogStore.getState().active).toBe('create-incident');
  });

  it('hides commands the role is not allowed to run', async () => {
    mockFetch({ 'GET /api/search': [] });
    const user = userEvent.setup();
    renderPalette('DEVELOPER');
    await user.keyboard('{Control>}k{/Control}');
    await screen.findByRole('combobox', { name: 'Command or search' });
    expect(screen.queryByRole('option', { name: /create project/i })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /create incident/i })).toBeInTheDocument();
  });
});
