import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../../../tests/setup/render';
import { PermissionGate } from './permission-gate';

describe('PermissionGate', () => {
  it('shows actions the role is allowed to perform', () => {
    renderWithProviders(<PermissionGate permission="team:remove"><button>Remove</button></PermissionGate>, { role: 'ADMIN' });
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('hides forbidden actions and renders the fallback', () => {
    renderWithProviders(
      <PermissionGate permission="project:create" fallback={<p>Read only</p>}>
        <button>New project</button>
      </PermissionGate>,
      { role: 'DEVELOPER' },
    );
    expect(screen.queryByRole('button', { name: 'New project' })).not.toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
  });
});
