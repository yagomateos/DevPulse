import type { NotificationSettings } from '@/schemas/settings';
import type { IncidentSeverity, Notification } from '@/types/domain';

const SEVERITY_RANK: Record<IncidentSeverity, number> = { sev1: 1, sev2: 2, sev3: 3, sev4: 4 };
const KIND_PREFERENCE: Record<Notification['kind'], keyof NotificationSettings['inApp']> = {
  incident: 'incidents',
  deployment: 'deployments',
  review: 'reviews',
  mention: 'mentions',
};

/** Applies Settings → Notifications to the inbox. */
export function applyNotificationPreferences(list: Notification[], prefs: NotificationSettings) {
  return list.filter((n) => {
    if (!prefs.inApp[KIND_PREFERENCE[n.kind]]) return false;
    if (n.kind === 'incident' && n.severity) return SEVERITY_RANK[n.severity] <= SEVERITY_RANK[prefs.minimumSeverity];
    return true;
  });
}
