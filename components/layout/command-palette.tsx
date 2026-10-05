'use client';

import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  FolderGit2,
  GitPullRequest,
  Rocket,
  AlertTriangle,
  Bot,
  Users,
  Settings,
  Moon,
  Sun,
  Search,
  AlertCircle,
  Boxes,
} from 'lucide-react';
import { projects, pullRequests, deployments, incidents } from '@/lib/mock-data';

export function CommandPalette() {
  const { isOpen, close } = useCommandPaletteStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const navigate = (href: string) => {
    router.push(href);
    close();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <CommandInput placeholder="Search or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate('/projects')}>
            <FolderGit2 className="mr-2 h-4 w-4" />
            Go to Projects
          </CommandItem>
          <CommandItem onSelect={() => navigate('/pull-requests')}>
            <GitPullRequest className="mr-2 h-4 w-4" />
            Go to Pull Requests
          </CommandItem>
          <CommandItem onSelect={() => navigate('/deployments')}>
            <Rocket className="mr-2 h-4 w-4" />
            Go to Deployments
          </CommandItem>
          <CommandItem onSelect={() => navigate('/incidents')}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Go to Incidents
          </CommandItem>
          <CommandItem onSelect={() => navigate('/ai')}>
            <Bot className="mr-2 h-4 w-4" />
            Ask AI
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Projects">
          {projects.slice(0, 4).map((p) => (
            <CommandItem
              key={p.id}
              onSelect={() => navigate(`/projects/${p.id}`)}
            >
              <Boxes className="mr-2 h-4 w-4" />
              {p.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pull Requests">
          {pullRequests.slice(0, 4).map((pr) => (
            <CommandItem
              key={pr.id}
              onSelect={() =>
                navigate(`/projects/${pr.projectId}/pull-requests/${pr.id}`)
              }
            >
              <GitPullRequest className="mr-2 h-4 w-4" />
              #{pr.number} — {pr.title.slice(0, 40)}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Deployments">
          {deployments.slice(0, 4).map((dep) => (
            <CommandItem
              key={dep.id}
              onSelect={() =>
                navigate(`/projects/${dep.projectId}/deployments/${dep.id}`)
              }
            >
              <Rocket className="mr-2 h-4 w-4" />
              {dep.commitSha} — {dep.commitMessage.slice(0, 30)}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Incidents">
          {incidents.slice(0, 3).map((inc) => (
            <CommandItem
              key={inc.id}
              onSelect={() =>
                navigate(`/projects/${inc.projectId}/incidents/${inc.id}`)
              }
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              {inc.title.slice(0, 40)}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => navigate('/team')}>
            <Users className="mr-2 h-4 w-4" />
            Go to Team
          </CommandItem>
          <CommandItem onSelect={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Open Settings
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
              close();
            }}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Switch to Light Theme
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Switch to Dark Theme
              </>
            )}
          </CommandItem>
          <CommandItem onSelect={() => navigate('/incidents')}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Create Incident
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
