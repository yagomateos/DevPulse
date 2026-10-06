import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/query-keys';
import { createDataset } from '@/server/data/dataset';
import { createTestQueryClient, renderWithProviders } from '../../../../tests/setup/render';
import { ProjectsView } from './projects-view';

const { projects } = createDataset();

function setup(role: 'ADMIN' | 'DEVELOPER' = 'ADMIN') {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(queryKeys.projects.list(), projects);
  return renderWithProviders(<ProjectsView />, { queryClient, role });
}

describe('ProjectsView', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('switches between grid and list while keeping filters in the URL', async () => {
    const user = userEvent.setup();
    setup();
    expect(within(screen.getByRole('list', { name: 'Projects' })).getAllByRole('listitem')).toHaveLength(projects.length);
    await user.click(screen.getByRole('button', { name: /status/i }));
    await user.click(await screen.findByRole('option', { name: /archived/i }));
    await user.keyboard('{Escape}');
    expect(within(await screen.findByRole('list', { name: 'Projects' })).getAllByRole('listitem')).toHaveLength(1);

    await user.click(screen.getByRole('radio', { name: 'List view' }));
    expect(window.location.search).toContain('view=list');
    expect(window.location.search).toContain('status=archived');
    const table = screen.getByRole('table', { name: 'Projects' });
    expect(within(table).getAllByRole('row')).toHaveLength(2); // header + 1 archived project
  });

  it('hides “New project” for developers', () => {
    setup('DEVELOPER');
    expect(screen.queryByRole('button', { name: /new project/i })).not.toBeInTheDocument();
  });
});
