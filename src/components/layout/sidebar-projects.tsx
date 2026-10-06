'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { healthTone } from '@/components/shared/health-score';
import { cn } from '@/lib/utils';
import { projectQueries } from '@/services/projects';

/** Quick access to active projects, sharing the cached projects query. */
export function SidebarProjects() {
  const pathname = usePathname();
  const { data, isPending } = useQuery({ ...projectQueries.list(), select: (projects) => projects.filter((p) => p.status === 'active').slice(0, 6) });
  return (
    <div>
      <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Projects</p>
      {isPending ? (
        <div className="space-y-1.5 px-2 py-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <ul className="space-y-0.5">
          {data?.map((p) => {
            const active = pathname.startsWith(`/projects/${p.id}`);
            return (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex h-7 items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground', active && 'bg-sidebar-accent text-foreground')}
                >
                  <span className={cn('size-1.5 shrink-0 rounded-full bg-current', healthTone(p.healthScore))} aria-hidden />
                  <span className="truncate">{p.name}</span>
                  {p.activeIncidents > 0 && <span className="ml-auto rounded bg-destructive/15 px-1 text-[10px] font-medium text-destructive" aria-label={`${p.activeIncidents} active incidents`}>{p.activeIncidents}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
