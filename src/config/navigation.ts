import {
  AlertTriangle,
  Boxes,
  GitPullRequest,
  LayoutDashboard,
  Network,
  Rocket,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Keyboard shortcut hint (g + key). */
  shortcut?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'G D' },
  { label: 'Projects', href: '/projects', icon: Boxes, shortcut: 'G P' },
  { label: 'Pull Requests', href: '/pull-requests', icon: GitPullRequest, shortcut: 'G R' },
  { label: 'Deployments', href: '/deployments', icon: Rocket, shortcut: 'G E' },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle, shortcut: 'G I' },
  { label: 'AI Assistant', href: '/ai', icon: Sparkles, shortcut: 'G A' },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: 'Team', href: '/team', icon: Users, shortcut: 'G T' },
  { label: 'Settings', href: '/settings', icon: Settings, shortcut: 'G S' },
  { label: 'Architecture', href: '/architecture', icon: Network },
];

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
