'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { projects, pullRequests, deployments, incidents } from '@/lib/mock-data';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  'pull-requests': 'Pull Requests',
  deployments: 'Deployments',
  incidents: 'Incidents',
  ai: 'AI Assistant',
  team: 'Team',
  settings: 'Settings',
  architecture: 'Architecture',
};

function getDynamicLabel(segment: string, path: string): string | undefined {
  const segments = path.split('/');
  const idx = segments.indexOf(segment);

  if (segment === 'projects' && idx >= 0 && segments[idx + 1]) {
    const project = projects.find((p) => p.id === segments[idx + 1]);
    return project?.name;
  }
  if (segment === 'pull-requests' && idx >= 0 && segments[idx + 1]) {
    const pr = pullRequests.find((p) => p.id === segments[idx + 1]);
    return pr ? `#${pr.number}` : undefined;
  }
  if (segment === 'deployments' && idx >= 0 && segments[idx + 1]) {
    const dep = deployments.find((d) => d.id === segments[idx + 1]);
    return dep ? dep.commitSha : undefined;
  }
  if (segment === 'incidents' && idx >= 0 && segments[idx + 1]) {
    const inc = incidents.find((i) => i.id === segments[idx + 1]);
    return inc?.title;
  }
  return undefined;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [];
  let href = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    href += `/${seg}`;
    const label =
      getDynamicLabel(seg, pathname) ||
      routeLabels[seg] ||
      seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({ label, href });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-hidden"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={crumb.href}>
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            )}
            {isLast ? (
              <span className="truncate font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
