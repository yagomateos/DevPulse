'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { useCachedQueryData } from '@/hooks/use-cached-query-data';
import { queryKeys } from '@/lib/query-keys';
import type { Project } from '@/types/domain';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  'pull-requests': 'Pull requests',
  deployments: 'Deployments',
  incidents: 'Incidents',
  activity: 'Activity',
  settings: 'Settings',
  team: 'Team',
  ai: 'AI Assistant',
  architecture: 'Architecture',
  general: 'General',
  account: 'Account',
  notifications: 'Notifications',
  security: 'Security',
  integrations: 'Integrations',
};

interface Crumb {
  href: string;
  label: string;
}

/** Derives crumbs from the URL; resolves project names from the query cache. */
export function useBreadcrumbs(): Crumb[] {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const projectId = segments[0] === 'projects' ? segments[1] : undefined;
  // The project layout hydrates this query; read it without creating it (see hook docs).
  const project = useCachedQueryData<Project>(queryKeys.projects.detail(projectId ?? ''), !!projectId);

  return segments.map((segment, i) => {
    const href = `/${segments.slice(0, i + 1).join('/')}`;
    const previous = segments[i - 1];
    let label = LABELS[segment] ?? decodeURIComponent(segment);
    if (previous === 'projects') label = project?.name ?? segment;
    else if (previous === 'pull-requests') label = `#${segment}`;
    else if (previous === 'deployments') label = `Deployment #${segment}`;
    else if (previous === 'incidents') label = segment.toUpperCase();
    return { href, label };
  });
}

export function Breadcrumbs({ className }: { className?: string }) {
  const crumbs = useBreadcrumbs();
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-1 text-[13px]">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />}
              <li className={cn('min-w-0', !last && 'hidden sm:block')}>
                {last ? (
                  <span aria-current="page" className="block truncate font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="block truncate rounded text-muted-foreground hover:text-foreground">
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
