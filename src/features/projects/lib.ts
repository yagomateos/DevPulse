import type { Project } from '@/types/domain';

/** Pure client-side filtering/sorting shared by the grid and list views. */
export function filterProjects(projects: Project[], { search, status, sort }: { search: string; status: string[]; sort?: { id: string; desc: boolean } }) {
  const term = search.trim().toLowerCase();
  const filtered = projects.filter(
    (p) => (status.length === 0 || status.includes(p.status)) && (!term || p.name.toLowerCase().includes(term) || p.repository.toLowerCase().includes(term)),
  );
  if (!sort) return filtered;
  const dir = sort.desc ? -1 : 1;
  const value = (p: Project): string | number => {
    switch (sort.id) {
      case 'healthScore':
        return p.healthScore;
      case 'openPullRequests':
        return p.openPullRequests;
      case 'activeIncidents':
        return p.activeIncidents;
      case 'lastDeploymentAt':
        return p.lastDeploymentAt ?? '';
      default:
        return p.name.toLowerCase();
    }
  };
  return [...filtered].sort((a, b) => (value(a) > value(b) ? dir : value(a) < value(b) ? -dir : 0));
}
