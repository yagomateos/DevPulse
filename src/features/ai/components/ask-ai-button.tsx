'use client';

import { Sparkles } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import { useAIPanelStore } from '@/stores/ai-panel-store';

/** Contextual entry point: opens the side panel, optionally with a prompt. */
export function AskAIButton({ prompt, children = 'Ask AI', ...props }: ButtonProps & { prompt?: string }) {
  const ask = useAIPanelStore((s) => s.ask);
  return (
    <PermissionGate permission="ai:chat">
      <Button variant="outline" size="sm" onClick={() => ask(prompt)} {...props}>
        <Sparkles className="text-primary" />
        {children}
      </Button>
    </PermissionGate>
  );
}
