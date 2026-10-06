import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/query-keys';
import { createDataset } from '@/server/data/dataset';
import { mockFetch } from '../../../../tests/setup/fetch-mock';
import { createTestQueryClient, jsonResponse, renderWithProviders } from '../../../../tests/setup/render';
import { TeamTable } from './team-table';

const { members } = createDataset();

function setup(role: 'ADMIN' | 'MANAGER' = 'ADMIN') {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(queryKeys.team.all, members);
  return renderWithProviders(<TeamTable />, { queryClient, role });
}

const row = (name: string) => screen.getByRole('row', { name: new RegExp(name) });

describe('TeamTable', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('changes a role optimistically and keeps it after the server confirms', async () => {
    mockFetch({ 'PATCH /api/team/usr_jordan': () => jsonResponse({ ...members.find((m) => m.id === 'usr_jordan'), role: 'MANAGER' }), 'GET /api/team': members.map((m) => (m.id === 'usr_jordan' ? { ...m, role: 'MANAGER' } : m)) });
    const user = userEvent.setup();
    setup();
    await user.click(within(row('Jordan Lee')).getByRole('button', { name: /actions for jordan lee/i }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Manager' }));
    expect(within(row('Jordan Lee')).getByText('Manager')).toBeInTheDocument();
  });

  it('rolls back the optimistic removal when the server refuses', async () => {
    // The server answers slowly, so the optimistic state is observable before the rollback.
    mockFetch({ 'DELETE /api/team/usr_jordan': () => new Promise((r) => setTimeout(() => r(jsonResponse({ error: { message: 'Simulated failure', status: 503 } }, 503)), 400)), 'GET /api/team': members });
    const user = userEvent.setup();
    setup();
    await user.click(within(row('Jordan Lee')).getByRole('button', { name: /actions for jordan lee/i }));
    await user.click(screen.getByRole('menuitem', { name: /remove member/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove member' }));
    // Gone right away (optimistic)…
    await vi.waitFor(() => expect(screen.queryByRole('row', { name: /Jordan Lee/ })).not.toBeInTheDocument());
    // …and restored after the 503.
    expect(await screen.findByRole('row', { name: /Jordan Lee/ })).toBeInTheDocument();
  });

  it('managers can invite but cannot change roles or remove members', () => {
    setup('MANAGER');
    expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /actions for/i })).not.toBeInTheDocument();
  });
});
