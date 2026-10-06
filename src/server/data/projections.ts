import type { ActivityItem, SearchResult } from '@/types/domain';
import type { Dataset } from './dataset';
import { matchesText } from './query';

type Graph = Pick<Dataset, 'projects' | 'pullRequests' | 'deployments' | 'incidents' | 'members'>;

/** Read-only projections shared by every Repository implementation. */

export function activityFromDataset(s: Graph, { projectId, limit = 12 }: { projectId?: string; limit?: number }): ActivityItem[] {
  const projectName = (id: string) => s.projects.find((p) => p.id === id)?.name ?? id;
  const items: ActivityItem[] = [
    ...s.pullRequests.map((pr) => ({
      id: `act-${pr.id}`,
      kind: 'pull_request' as const,
      title: `${pr.status === 'merged' ? 'Merged' : pr.status === 'closed' ? 'Closed' : 'Updated'} #${pr.number}`,
      description: pr.title,
      actor: pr.author,
      occurredAt: pr.updatedAt,
      projectId: pr.projectId,
      href: `/projects/${pr.projectId}/pull-requests/${pr.number}`,
    })),
    ...s.deployments.map((d) => ({
      id: `act-${d.id}`,
      kind: 'deployment' as const,
      title: `Deployment #${d.number} ${d.status.replace('_', ' ')}`,
      description: `${projectName(d.projectId)} · ${d.environment}`,
      actor: d.author,
      occurredAt: d.startedAt,
      projectId: d.projectId,
      href: `/projects/${d.projectId}/deployments/${d.number}`,
    })),
    ...s.incidents.map((i) => ({
      id: `act-${i.id}`,
      kind: 'incident' as const,
      title: `${i.reference} ${i.status === 'resolved' ? 'resolved' : 'opened'}`,
      description: i.title,
      actor: i.assignee ?? 'Monitoring',
      occurredAt: i.resolvedAt ?? i.createdAt,
      projectId: i.projectId,
      href: `/projects/${i.projectId}/incidents/${i.id}`,
    })),
  ];
  return items
    .filter((i) => !projectId || i.projectId === projectId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}

export function searchDataset(s: Graph, q: string, perGroup = 5): SearchResult[] {
  const term = q.trim();
  if (!term) return [];
  const results: SearchResult[] = [
    ...s.projects
      .filter((p) => matchesText(term, p.name, p.repository))
      .map((p) => ({ type: 'project' as const, id: p.id, title: p.name, subtitle: p.repository, href: `/projects/${p.id}` })),
    ...s.pullRequests
      .filter((p) => matchesText(term, p.title, p.number, p.author))
      .map((p) => ({ type: 'pull_request' as const, id: p.id, title: p.title, subtitle: `#${p.number} · ${p.author}`, href: `/projects/${p.projectId}/pull-requests/${p.number}` })),
    ...s.deployments
      .filter((d) => matchesText(term, d.commitMessage, d.commitSha, `#${d.number}`))
      .map((d) => ({ type: 'deployment' as const, id: d.id, title: d.commitMessage, subtitle: `#${d.number} · ${d.environment} · ${d.status.replace('_', ' ')}`, href: `/projects/${d.projectId}/deployments/${d.number}` })),
    ...s.incidents
      .filter((i) => matchesText(term, i.title, i.reference, i.service))
      .map((i) => ({ type: 'incident' as const, id: i.id, title: i.title, subtitle: `${i.reference} · ${i.severity.toUpperCase()} · ${i.status}`, href: `/projects/${i.projectId}/incidents/${i.id}` })),
    ...s.members
      .filter((m) => matchesText(term, m.name, m.email))
      .map((m) => ({ type: 'member' as const, id: m.id, title: m.name, subtitle: `${m.email} · ${m.role}`, href: `/team?q=${encodeURIComponent(m.name)}` })),
  ];
  // Cap per group so a broad term doesn't flood the palette.
  const perType = new Map<string, number>();
  return results.filter((r) => {
    const n = (perType.get(r.type) ?? 0) + 1;
    perType.set(r.type, n);
    return n <= perGroup;
  });
}
