import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/server/repositories/defaults';
import { mockFetch } from '../../../../tests/setup/fetch-mock';
import { routerMock } from '../../../../tests/setup/next-navigation-mock';
import { jsonResponse, renderWithProviders } from '../../../../tests/setup/render';
import { GeneralSettingsForm } from './general-settings-form';

describe('GeneralSettingsForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('saves a new time zone and refreshes server-rendered dates', async () => {
    const fetchSpy = mockFetch({ 'PUT /api/settings/general': (_url: URL, init?: RequestInit) => jsonResponse({ ...DEFAULT_SETTINGS, general: JSON.parse(String(init?.body)) }) });
    const user = userEvent.setup();
    renderWithProviders(<GeneralSettingsForm defaults={DEFAULT_SETTINGS.general} />);
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).toBeDisabled(); // nothing changed yet

    await user.click(screen.getByRole('combobox', { name: 'Time zone' }));
    await user.keyboard('tokyo{Enter}');
    await user.click(save);

    await vi.waitFor(() => expect(routerMock.refresh).toHaveBeenCalled());
    const body = JSON.parse(String(fetchSpy.mock.calls[0]![1]!.body));
    expect(body.timezone).toBe('Asia/Tokyo');
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('is read-only for roles without workspace permissions', () => {
    renderWithProviders(<GeneralSettingsForm defaults={DEFAULT_SETTINGS.general} />, { role: 'DEVELOPER' });
    expect(screen.getByText(/only admins can change workspace settings/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Workspace name' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('validates the workspace name', async () => {
    const fetchSpy = mockFetch({});
    const user = userEvent.setup();
    renderWithProviders(<GeneralSettingsForm defaults={DEFAULT_SETTINGS.general} />);
    await user.clear(screen.getByRole('textbox', { name: 'Workspace name' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Workspace name is required')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
