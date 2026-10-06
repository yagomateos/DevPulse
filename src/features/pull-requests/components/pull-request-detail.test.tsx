import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/query-keys';
import { createDataset } from '@/server/data/dataset';
import { analyzePullRequestHeuristic } from '@/server/ai/heuristics';
import { mockFetch } from '../../../../tests/setup/fetch-mock';
import { createTestQueryClient, jsonResponse, renderWithProviders } from '../../../../tests/setup/render';
import { PullRequestDetail } from './pull-request-detail';

const data = createDataset(Date.UTC(2026, 9, 5, 10));
const pr = data.pullRequests.find((p) => p.id === 'orion-gateway#312')!;

function setup() {
  const queryClient = createTestQueryClient();
  // Data the server would have prefetched and hydrated.
  queryClient.setQueryData(queryKeys.pullRequests.detail('orion-gateway', 312), pr);
  queryClient.setQueryData(queryKeys.ai.analysis('pull_request', 'orion-gateway', '312'), null);
  return queryClient;
}

describe('PullRequestDetail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('renders PR metadata, checks and linked deployments', async () => {
    mockFetch({ 'GET /api/deployments': { items: data.deployments.filter((d) => d.projectId === 'orion-gateway').slice(0, 5), total: 5, page: 1, pageSize: 50, pageCount: 1 } });
    const user = userEvent.setup();
    renderWithProviders(<PullRequestDetail projectId="orion-gateway" number={312} />, { queryClient: setup() });
    expect(screen.getByRole('heading', { name: /fix authentication bypass/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /#128/ })).toHaveAttribute('href', '/projects/orion-gateway/deployments/128');
    await user.click(screen.getByRole('tab', { name: /checks/i }));
    expect(screen.getByText('1 of 6 checks failed')).toBeInTheDocument();
  });

  it('runs the AI analysis and renders structured results, linking findings to the diff', async () => {
    const result = analyzePullRequestHeuristic(pr);
    const fetchSpy = mockFetch({
      'GET /api/deployments': { items: [], total: 0, page: 1, pageSize: 50, pageCount: 1 },
      'POST /api/ai/analyze': () => jsonResponse({ id: 'a1', kind: 'pull_request', targetId: pr.id, model: 'demo-heuristic-v1', createdAt: new Date().toISOString(), result }),
    });
    const user = userEvent.setup();
    renderWithProviders(<PullRequestDetail projectId="orion-gateway" number={312} />, { queryClient: setup() });

    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }));
    expect(await screen.findByRole('img', { name: new RegExp(`Risk score ${result.riskScore} of 100`) })).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith('/api/ai/analyze', expect.objectContaining({ method: 'POST', body: JSON.stringify({ kind: 'pull_request', projectId: 'orion-gateway', key: '312' }) }));
    const findings = screen.getByRole('region', { name: 'Findings' });
    expect(within(findings).getByRole('heading', { name: 'Global lock on the request hot path' })).toBeInTheDocument();

    // Clicking a finding's location opens the Files tab with the annotation inline.
    await user.click(within(findings).getAllByRole('button', { name: /internal\/middleware\/ratelimit\.go:/ })[0]!);
    expect(window.location.search).toContain('tab=files');
    expect(screen.getByRole('region', { name: 'Changes in internal/middleware/ratelimit.go' })).toHaveTextContent('Global lock on the request hot path');
  });

  it('shows an error with retry when the analysis fails', async () => {
    mockFetch({
      'GET /api/deployments': { items: [], total: 0, page: 1, pageSize: 50, pageCount: 1 },
      'POST /api/ai/analyze': () => jsonResponse({ error: { message: 'The model returned an invalid analysis. Try again.', status: 502 } }, 502),
    });
    const user = userEvent.setup();
    renderWithProviders(<PullRequestDetail projectId="orion-gateway" number={312} />, { queryClient: setup() });
    await user.click(screen.getByRole('button', { name: 'Analyze with AI' }));
    expect(await screen.findByText('Analysis failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
