'use client';

import { AlertTriangle, Boxes, FolderPlus, GitPullRequest, LayoutDashboard, Moon, Network, Rocket, Search, Settings, Sparkles, UserPlus, Users, type LucideIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { useHotkeys } from '@/hooks/use-hotkeys';
import type { Permission } from '@/lib/permissions';
import { useAIPanelStore } from '@/stores/ai-panel-store';
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import { useDialogStore } from '@/stores/dialog-store';

export interface PaletteCommand {
  id: string;
  label: string;
  group: 'Navigation' | 'Actions' | 'Preferences' | 'Current project';
  icon: LucideIcon;
  shortcut?: string;
  keywords?: string[];
  permission?: Permission;
  run: () => void;
}

/**
 * Command registry + global shortcuts. Commands are plain data so the palette
 * stays a dumb renderer and new commands are one object away.
 */
export function useCommandPalette() {
  const router = useRouter();
  const params = useParams<{ projectId?: string }>();
  const { setTheme, resolvedTheme } = useTheme();
  const { can } = usePermissions();
  const palette = useCommandPaletteStore();
  const askAI = useAIPanelStore((s) => s.ask);
  const openDialog = useDialogStore((s) => s.openDialog);
  const projectId = params?.projectId;

  const commands = useMemo<PaletteCommand[]>(() => {
    const go = (href: string) => () => router.push(href);
    const list: PaletteCommand[] = [
      { id: 'search', label: 'Search workspace…', group: 'Actions', icon: Search, shortcut: '⌘K', run: () => palette.show('search') },
      { id: 'ask-ai', label: 'Ask AI', group: 'Actions', icon: Sparkles, shortcut: '⌘J', keywords: ['assistant', 'chat'], permission: 'ai:chat', run: () => askAI() },
      { id: 'create-incident', label: 'Create incident', group: 'Actions', icon: AlertTriangle, keywords: ['declare', 'outage'], permission: 'incident:create', run: () => openDialog('create-incident', { projectId: projectId ?? null }) },
      { id: 'create-project', label: 'Create project', group: 'Actions', icon: FolderPlus, permission: 'project:create', run: () => openDialog('create-project') },
      { id: 'invite', label: 'Invite member', group: 'Actions', icon: UserPlus, permission: 'team:invite', run: () => openDialog('invite-member') },
      { id: 'go-dashboard', label: 'Go to Dashboard', group: 'Navigation', icon: LayoutDashboard, shortcut: 'G D', run: go('/dashboard') },
      { id: 'go-projects', label: 'Go to Projects', group: 'Navigation', icon: Boxes, shortcut: 'G P', run: go('/projects') },
      { id: 'go-prs', label: 'Go to Pull Requests', group: 'Navigation', icon: GitPullRequest, shortcut: 'G R', run: go('/pull-requests') },
      { id: 'go-deployments', label: 'Go to Deployments', group: 'Navigation', icon: Rocket, shortcut: 'G E', run: go('/deployments') },
      { id: 'go-incidents', label: 'Go to Incidents', group: 'Navigation', icon: AlertTriangle, shortcut: 'G I', run: go('/incidents') },
      { id: 'go-ai', label: 'Go to AI Assistant', group: 'Navigation', icon: Sparkles, shortcut: 'G A', run: go('/ai') },
      { id: 'go-team', label: 'Go to Team', group: 'Navigation', icon: Users, shortcut: 'G T', run: go('/team') },
      { id: 'go-architecture', label: 'Go to Architecture', group: 'Navigation', icon: Network, run: go('/architecture') },
      { id: 'settings', label: 'Open Settings', group: 'Preferences', icon: Settings, shortcut: 'G S', run: go('/settings') },
      { id: 'theme', label: `Toggle theme (${resolvedTheme === 'dark' ? 'light' : 'dark'})`, group: 'Preferences', icon: Moon, keywords: ['dark', 'light', 'appearance'], run: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark') },
    ];
    if (projectId) {
      list.push(
        { id: 'project-prs', label: 'This project · Pull requests', group: 'Current project', icon: GitPullRequest, run: go(`/projects/${projectId}/pull-requests`) },
        { id: 'project-deployments', label: 'This project · Deployments', group: 'Current project', icon: Rocket, run: go(`/projects/${projectId}/deployments`) },
        { id: 'project-incidents', label: 'This project · Incidents', group: 'Current project', icon: AlertTriangle, run: go(`/projects/${projectId}/incidents`) },
      );
    }
    return list.filter((c) => !c.permission || can(c.permission));
  }, [router, palette, askAI, openDialog, projectId, resolvedTheme, setTheme, can]);

  useHotkeys({
    'mod+k': () => (palette.open ? palette.hide() : palette.show('commands')),
    'mod+j': () => can('ai:chat') && askAI(),
    '/': () => palette.show('search'),
    'g d': () => router.push('/dashboard'),
    'g p': () => router.push('/projects'),
    'g r': () => router.push('/pull-requests'),
    'g e': () => router.push('/deployments'),
    'g i': () => router.push('/incidents'),
    'g a': () => router.push('/ai'),
    'g t': () => router.push('/team'),
    'g s': () => router.push('/settings'),
  });

  return { commands, ...palette };
}
