'use client';

import { create } from 'zustand';
import type { AIContext } from '@/schemas/ai';

export const WORKSPACE_CONTEXT: AIContext = { type: 'workspace', id: null, label: 'Workspace' };

/**
 * The AI side panel is global UI; pages register *what* the user is looking
 * at. Contexts form a stack mirroring nested layouts: the project layout
 * registers the project, a PR page pushes the PR on top, and leaving the PR
 * page restores the project context.
 */
interface AIPanelState {
  open: boolean;
  stack: AIContext[];
  context: AIContext;
  /** Prompt queued by a contextual action ("Ask AI about this"). */
  pendingPrompt: string | null;
  setOpen: (open: boolean) => void;
  ask: (prompt?: string) => void;
  pushContext: (context: AIContext) => void;
  removeContext: (context: AIContext) => void;
  consumePrompt: () => string | null;
}

const same = (a: AIContext, b: AIContext) => a.type === b.type && a.id === b.id;

export const useAIPanelStore = create<AIPanelState>((set, get) => ({
  open: false,
  stack: [],
  context: WORKSPACE_CONTEXT,
  pendingPrompt: null,
  setOpen: (open) => set({ open }),
  ask: (prompt) => set({ open: true, pendingPrompt: prompt ?? null }),
  pushContext: (context) =>
    set((s) => {
      const stack = [...s.stack.filter((c) => !same(c, context)), context];
      return { stack, context };
    }),
  removeContext: (context) =>
    set((s) => {
      const index = s.stack.findLastIndex((c) => same(c, context));
      if (index < 0) return s;
      const stack = s.stack.filter((_, i) => i !== index);
      return { stack, context: stack.at(-1) ?? WORKSPACE_CONTEXT };
    }),
  consumePrompt: () => {
    const prompt = get().pendingPrompt;
    if (prompt) set({ pendingPrompt: null });
    return prompt;
  },
}));
