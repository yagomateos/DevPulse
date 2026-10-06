'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavTab {
  label: string;
  href: string;
  icon?: LucideIcon;
  count?: number;
  /** Match nested routes (default) or only the exact path. */
  exact?: boolean;
}

/**
 * Route-driven tabs: each tab is a real link (shareable URL, back button,
 * prefetching) and the active state is derived from the pathname.
 */
export function NavTabs({ tabs, label, className }: { tabs: NavTab[]; label: string; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={cn('-mb-px flex gap-1 overflow-x-auto border-b scrollbar-thin', className)}>
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground',
              'after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent',
              active && 'text-foreground after:bg-primary',
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="rounded bg-muted px-1.5 py-px text-[11px] tabular-nums text-muted-foreground">{tab.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
