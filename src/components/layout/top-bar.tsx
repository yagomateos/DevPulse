'use client';

import { Menu, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/shared/kbd';
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import { useAIPanelStore } from '@/stores/ai-panel-store';
import { useUIStore } from '@/stores/ui-store';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationsMenu } from './notifications-menu';
import { UserMenu } from './user-menu';

export function TopBar() {
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const showPalette = useCommandPaletteStore((s) => s.show);
  const askAI = useAIPanelStore((s) => s.ask);

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-4">
      <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
        <Menu />
      </Button>
      <Breadcrumbs className="flex-1" />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => showPalette('search')}
          className="hidden h-8 w-56 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted md:flex"
          aria-label="Search the workspace"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="flex-1 text-left">Search…</span>
          <Kbd>⌘K</Kbd>
        </button>
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => showPalette('search')} aria-label="Search">
          <Search />
        </Button>
        <Button variant="outline" size="sm" onClick={() => askAI()} className="gap-1.5" aria-keyshortcuts="Meta+J Control+J" aria-label="Ask AI">
          <Sparkles className="text-primary" />
          <span className="hidden sm:inline">Ask AI</span>
        </Button>
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
