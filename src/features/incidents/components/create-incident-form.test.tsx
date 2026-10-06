import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDataset } from '@/server/data/dataset';
import { mockFetch } from '../../../../tests/setup/fetch-mock';
import { routerMock } from '../../../../tests/setup/next-navigation-mock';
import { jsonResponse, renderWithProviders } from '../../../../tests/setup/render';
import { CreateIncidentForm } from './create-incident-form';

const data = createDataset();

function routes(extra: Record<string, unknown> = {}) {
  return mockFetch({
    'GET /api/projects': data.projects,
    'GET /api/team': data.members,
    'GET /api/incidents/facets': { services: ['auth-service', 'database'], assignees: [] },
    'GET /api/deployments': { items: [], total: 0, page: 1, pageSize: 8, pageCount: 1 },
    ...extra,
  });
}

describe('CreateIncidentForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows field errors without calling the API', async () => {
    const spy = routes();
    const user = userEvent.setup();
    renderWithProviders(<CreateIncidentForm onDone={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Declare incident' }));
    expect(await screen.findByText('Select a project')).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute('aria-invalid', 'true');
    expect(spy.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('submits a valid incident and navigates to it', async () => {
    const onDone = vi.fn();
    const spy = routes({ 'POST /api/incidents': () => jsonResponse({ ...data.incidents[0], id: 'inc-43', reference: 'INC-43' }, 201) });
    const user = userEvent.setup();
    renderWithProviders(<CreateIncidentForm defaultProjectId="orion-gateway" onDone={onDone} />);
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Token endpoint returns 502');
    await user.type(screen.getByRole('textbox', { name: /what’s happening/i }), 'Clients receive 502s from POST /v1/token since 07:20.');
    await user.click(screen.getByRole('combobox', { name: 'Affected service' }));
    await user.click(await screen.findByRole('option', { name: 'auth-service' }));
    await user.click(screen.getByRole('radio', { name: /sev2/i }));
    await user.click(screen.getByRole('button', { name: 'Declare incident' }));

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
    const post = spy.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toMatchObject({ projectId: 'orion-gateway', service: 'auth-service', severity: 'sev2' });
    expect(routerMock.push).toHaveBeenCalledWith('/projects/orion-gateway/incidents/inc-43');
  });

  it('maps server-side validation errors onto fields', async () => {
    routes({ 'POST /api/incidents': () => jsonResponse({ error: { message: 'Validation failed', status: 422, issues: [{ path: 'title', message: 'A similar incident is already open' }] } }, 422) });
    const user = userEvent.setup();
    renderWithProviders(<CreateIncidentForm defaultProjectId="orion-gateway" onDone={vi.fn()} />);
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Token endpoint returns 502');
    await user.type(screen.getByRole('textbox', { name: /what’s happening/i }), 'Clients receive 502s from POST /v1/token since 07:20.');
    await user.click(screen.getByRole('combobox', { name: 'Affected service' }));
    await user.click(await screen.findByRole('option', { name: 'database' }));
    await user.click(screen.getByRole('button', { name: 'Declare incident' }));
    expect(await screen.findByText('A similar incident is already open')).toBeInTheDocument();
    expect(screen.getByText('Please fix the highlighted fields.')).toBeInTheDocument();
  });
});
