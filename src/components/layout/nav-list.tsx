'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isActive, type NavItem } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface NavListProps {
  items: NavItem[];
  /** Icon-only rendering with tooltips. */
  collapsed?: boolean;
  /** Labels hidden by CSS on tablet widths (md → xl). */
  responsive?: boolean;
  onNavigate?: () => void;
}

export function NavList({ items, collapsed = false, responsive = false, onNavigate }: NavListProps) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
              active && 'bg-sidebar-accent text-foreground',
              collapsed && 'justify-center px-0',
              responsive && !collapsed && 'md:justify-center md:px-0 xl:justify-start xl:px-2',
            )}
          >
            <Icon className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} aria-hidden />
            <span className={cn('truncate', collapsed && 'sr-only', responsive && !collapsed && 'md:sr-only xl:not-sr-only')}>{item.label}</span>
          </Link>
        );
        return (
          <li key={item.href}>
            {collapsed || responsive ? (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className={cn(!collapsed && responsive && 'xl:hidden')}>
                  {item.label}
                  {item.shortcut && <span className="ml-2 font-mono text-[10px] text-muted-foreground">{item.shortcut}</span>}
                </TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );
}
