import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDataset } from '@/server/data/dataset';
import { computeDashboardMetrics } from '@/server/data/analytics';
import { mockFetch } from '../../../../tests/setup/fetch-mock';
import { jsonResponse, renderWithProviders } from '../../../../tests/setup/render';
import { MetricGrid } from './metric-grid';

const metrics = computeDashboardMetrics(createDataset(), { range: '7d' });

describe('Dashboard MetricGrid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('shows a skeleton, then KPI cards with drill-down links', async () => {
    mockFetch({ 'GET /api/dashboard/metrics': metrics });
    renderWithProviders(<MetricGrid />);
    expect(screen.getByRole('status', { name: /loading metrics/i })).toBeInTheDocument();
    const incidents = await screen.findByRole('link', { name: /active incidents/i });
    expect(incidents).toHaveAttribute('href', '/incidents?status=investigating,identified,monitoring');
    expect(screen.getAllByRole('link')).toHaveLength(6);
  });

  it('requests metrics for the range in the URL', async () => {
    window.history.replaceState(null, '', '/dashboard?range=30d&projectId=atlas-web');
    const fetchSpy = mockFetch({ 'GET /api/dashboard/metrics': { ...metrics, range: '30d' } });
    renderWithProviders(<MetricGrid />);
    await screen.findByRole('link', { name: /deployments/i });
    expect(String(fetchSpy.mock.calls[0]![0])).toBe('/api/dashboard/metrics?range=30d&projectId=atlas-web');
  });

  it('recovers from an API error via retry', async () => {
    let calls = 0;
    mockFetch({ 'GET /api/dashboard/metrics': () => (++calls === 1 ? jsonResponse({ error: { message: 'Simulated outage', status: 503 } }, 503) : jsonResponse(metrics)) });
    const user = userEvent.setup();
    renderWithProviders(<MetricGrid />);
    expect(await screen.findByText('Metrics are unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('link', { name: /engineering health/i })).toBeInTheDocument();
  });
});
