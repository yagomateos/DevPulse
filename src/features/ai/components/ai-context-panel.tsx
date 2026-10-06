'use client';

import { Maximize2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAIPanelStore } from '@/stores/ai-panel-store';
import { ChatWindow } from './chat-window';

/**
 * Global "Ask AI" side panel. Its context comes from whichever page is
 * mounted (useRegisterAIContext) — the panel itself knows nothing about PRs,
 * deployments or incidents. A new conversation starts when the context changes.
 */
export function AIContextPanel() {
  const { open, setOpen, context, pendingPrompt, consumePrompt } = useAIPanelStore();
  const onConsumed = useCallback(() => void consumePrompt(), [consumePrompt]);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b px-4 py-3 pr-12">
          <div>
            <SheetTitle className="text-sm">Ask AI</SheetTitle>
            <SheetDescription className="text-xs">Grounded in {context.type === 'workspace' ? 'your workspace' : context.label}</SheetDescription>
          </div>
          <Button asChild size="icon-sm" variant="ghost" aria-label="Open full assistant">
            <Link href="/ai" onClick={() => setOpen(false)}>
              <Maximize2 />
            </Link>
          </Button>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <ChatWindow key={`${context.type}:${context.id}`} context={context} initialPrompt={pendingPrompt} onInitialPromptConsumed={onConsumed} autoFocus />
        </div>
      </SheetContent>
    </Sheet>
  );
}
