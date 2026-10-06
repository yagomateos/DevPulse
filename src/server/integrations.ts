import 'server-only';
import type { IntegrationsSettings } from '@/schemas/settings';
import type { Incident } from '@/types/domain';
import type { Repository } from './repositories';

/**
 * Mock connectors. External services need credentials, so delivery is
 * simulated — but the effect is real and visible: each connected integration
 * records what it would have done on the incident timeline.
 */
export async function dispatchIncidentIntegrations(repo: Repository, incident: Incident, integrations: IntegrationsSettings, actor: string): Promise<Incident> {
  let current = incident;
  const note = async (text: string) => {
    current = (await repo.incidents.update(current.id, { status: current.status, note: text }, actor)) ?? current;
  };
  if (integrations.slack.connected) {
    await note(`[Slack · mock connector] Posted incident summary to ${integrations.slack.channel || '#incidents'}.`);
  }
  if (integrations.pagerduty.connected && (incident.severity === 'sev1' || incident.severity === 'sev2')) {
    await note(`[PagerDuty · mock connector] Paged on-call for ${incident.service} (service key ${integrations.pagerduty.serviceKey || 'not set'}).`);
  }
  return current;
}
