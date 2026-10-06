'use client';

import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRIMARY_NAV, SECONDARY_NAV } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { Logo } from './logo';
import { NavList } from './nav-list';
import { SidebarProjects } from './sidebar-projects';

/**
 * Desktop/tablet sidebar. Width is CSS-driven so the server render and the
 * first client render match: tablets (md→xl) always get the icon rail,
 * desktops honour the user's persisted collapse preference.
 */
export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      aria-label="Primary"
      data-collapsed={collapsed}
      className={cn(
        'hidden shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 md:flex md:w-[52px]',
        collapsed ? 'xl:w-[52px]' : 'xl:w-60',
      )}
    >
      <div className={cn('flex h-12 items-center border-b px-3', !collapsed && 'xl:px-3')}>
        <Link href="/dashboard" aria-label="DevPulse home" className="rounded-md">
          <Logo withText={false} className={cn(!collapsed && 'xl:hidden')} />
          <Logo className={cn('hidden', !collapsed && 'xl:flex')} />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2 scrollbar-thin" aria-label="Main navigation">
        <NavList items={PRIMARY_NAV} collapsed={collapsed} responsive />
        <div className={cn('hidden', !collapsed && 'xl:block')}>
          <SidebarProjects />
        </div>
        <div className="mt-auto">
          <NavList items={SECONDARY_NAV} collapsed={collapsed} responsive />
        </div>
      </nav>
      <div className="hidden border-t p-2 xl:block">
        <Button variant="ghost" size="sm" onClick={toggle} className={cn('w-full justify-start text-muted-foreground', collapsed && 'justify-center px-0')} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
