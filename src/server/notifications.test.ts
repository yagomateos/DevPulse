import { describe, expect, it } from 'vitest';
import type { Notification } from '@/types/domain';
import { applyNotificationPreferences } from './notifications';

const base = { body: '', href: '/', createdAt: '2026-10-05T00:00:00Z', read: false };
const list: Notification[] = [
  { ...base, id: 'sev1', kind: 'incident', title: 'SEV1', severity: 'sev1' },
  { ...base, id: 'sev4', kind: 'incident', title: 'SEV4', severity: 'sev4' },
  { ...base, id: 'deploy', kind: 'deployment', title: 'Failed' },
  { ...base, id: 'review', kind: 'review', title: 'Review' },
  { ...base, id: 'mention', kind: 'mention', title: 'Mention' },
];
const all = { incidents: true, deployments: true, reviews: true, mentions: true };

describe('notification preferences', () => {
  it('drops incidents below the minimum severity', () => {
    expect(applyNotificationPreferences(list, { inApp: all, minimumSeverity: 'sev2' }).map((n) => n.id)).toEqual(['sev1', 'deploy', 'review', 'mention']);
  });

  it('hides disabled categories', () => {
    const result = applyNotificationPreferences(list, { inApp: { ...all, deployments: false, mentions: false }, minimumSeverity: 'sev4' });
    expect(result.map((n) => n.id)).toEqual(['sev1', 'sev4', 'review']);
  });
});
