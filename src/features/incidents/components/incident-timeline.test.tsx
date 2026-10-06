import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { TimelineEvent } from '@/types/domain';
import { IncidentTimeline } from './incident-timeline';

const T0 = '2026-10-05T07:20:00.000Z';
const events: TimelineEvent[] = [
  { id: 'e3', type: 'created', title: 'Incident opened', description: 'Opened by alert', occurredAt: T0, actor: 'Monitoring' },
  { id: 'e1', type: 'deployment', title: 'Deployment #128', description: 'Rollout started', occurredAt: '2026-10-05T07:12:00.000Z', actor: 'Sarah Kim', href: '/projects/orion-gateway/deployments/128' },
  { id: 'e2', type: 'error', title: 'Error rate spike', description: '5xx at 3.2%', occurredAt: '2026-10-05T07:15:00.000Z', actor: null, metadata: { to: '3.2%' } },
  { id: 'e4', type: 'resolution', title: 'Resolved', description: 'Back to normal', occurredAt: '2026-10-05T08:30:00.000Z', actor: 'Sarah Kim' },
];

describe('IncidentTimeline', () => {
  it('orders events chronologically with T± offsets from the incident start', () => {
    render(<IncidentTimeline events={events} startedAt={T0} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('button')?.textContent)).toEqual([
      expect.stringContaining('T−8m'),
      expect.stringContaining('T−5m'),
      expect.stringContaining('T0'),
      expect.stringContaining('T+1h 10m'),
    ]);
  });

  it('filters by event type with toggle buttons', async () => {
    const user = userEvent.setup();
    render(<IncidentTimeline events={events} startedAt={T0} />);
    const errorToggle = screen.getByRole('button', { name: 'Error (1)' });
    await user.click(errorToggle);
    expect(errorToggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('Error rate spike')).not.toBeInTheDocument();
    await user.click(errorToggle);
    expect(screen.getByText('Error rate spike')).toBeInTheDocument();
  });

  it('expands events to reveal details and deep links', async () => {
    const user = userEvent.setup();
    render(<IncidentTimeline events={events} startedAt={T0} />);
    // Deployment events start expanded so the likely trigger is visible.
    expect(screen.getByRole('link', { name: /open related record/i })).toHaveAttribute('href', '/projects/orion-gateway/deployments/128');
    const errorEvent = screen.getByRole('button', { name: /error rate spike/i });
    expect(errorEvent).toHaveAttribute('aria-expanded', 'false');
    await user.click(errorEvent);
    expect(errorEvent).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('5xx at 3.2%')).toBeInTheDocument();
  });
});
