import type { ReactNode } from 'react';
import { CommandPalette } from '@/components/command-palette/command-palette';
import { AIContextPanel } from '@/features/ai/components/ai-context-panel';
import { SessionWatcher } from '@/features/auth/components/session-watcher';
import { GlobalDialogs } from './global-dialogs';
import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

/**
 * Server Component composing the client islands of the shell. Page content
 * (`children`) stays server-rendered; only interactive chrome hydrates.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto scrollbar-thin focus:outline-none">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <CommandPalette />
      <AIContextPanel />
      <GlobalDialogs />
      <SessionWatcher />
    </div>
  );
}
