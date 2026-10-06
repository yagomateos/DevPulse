import type { CreateIncidentInput, UpdateIncidentInput } from '@/schemas/incident';
import type { Deployment, Incident, IncidentStatus, Notification, TimelineEventType } from '@/types/domain';

/**
 * Pure incident rules shared by every Repository implementation, so the
 * in-memory demo store and PostgreSQL behave identically.
 */

export function nextIncidentNumber(existingIds: string[]) {
  return Math.max(0, ...existingIds.map((id) => Number(id.split('-')[1]) || 0)) + 1;
}

export function buildIncident(input: CreateIncidentInput, actor: string, number: number, deployment: Deployment | null, now = new Date().toISOString()): Incident {
  const id = `inc-${number}`;
  return {
    id,
    reference: `INC-${number}`,
    projectId: input.projectId,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: 'investigating',
    service: input.service,
    assignee: input.assignee,
    affectedUsers: 0,
    createdAt: now,
    resolvedAt: null,
    relatedDeploymentId: deployment?.id ?? null,
    timeline: [
      ...(deployment
        ? [{ id: `${id}-e0`, type: 'deployment' as const, title: `Deployment #${deployment.number}`, description: deployment.commitMessage, occurredAt: deployment.startedAt, actor: deployment.author, href: `/projects/${deployment.projectId}/deployments/${deployment.number}` }]
        : []),
      { id: `${id}-e1`, type: 'created', title: 'Incident opened', description: `Declared manually by ${actor}.`, occurredAt: now, actor },
    ],
  };
}

export function incidentNotification(incident: Incident, now = incident.createdAt): Notification {
  return {
    id: `ntf-${incident.id}`,
    kind: 'incident',
    title: `${incident.severity.toUpperCase()} · ${incident.reference} opened`,
    body: incident.title,
    href: `/projects/${incident.projectId}/incidents/${incident.id}`,
    createdAt: now,
    read: false,
    severity: incident.severity,
  };
}

const EVENT_BY_STATUS: Record<IncidentStatus, TimelineEventType> = {
  investigating: 'investigation',
  identified: 'investigation',
  monitoring: 'mitigation',
  resolved: 'resolution',
};

/** Returns a new incident with the status change and/or note appended to the timeline. */
export function applyIncidentUpdate(incident: Incident, input: UpdateIncidentInput, actor: string, now = new Date().toISOString()): Incident {
  const next: Incident = { ...incident, timeline: [...incident.timeline] };
  const eventId = () => `${incident.id}-e${next.timeline.length + 1}`;
  if (incident.status !== input.status) {
    next.status = input.status;
    next.resolvedAt = input.status === 'resolved' ? now : null;
    next.timeline.push({ id: eventId(), type: EVENT_BY_STATUS[input.status], title: `Status changed to ${input.status}`, description: input.note || `Updated by ${actor}.`, occurredAt: now, actor });
  } else if (input.note) {
    next.timeline.push({ id: eventId(), type: 'note', title: 'Note added', description: input.note, occurredAt: now, actor });
  }
  return next;
}
