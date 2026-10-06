'use client';

import { useEffect } from 'react';
import type { AIContext } from '@/schemas/ai';
import { useAIPanelStore } from '@/stores/ai-panel-store';

/** Tells the global AI panel what the user is looking at while this component is mounted. */
export function useRegisterAIContext(context: AIContext) {
  const push = useAIPanelStore((s) => s.pushContext);
  const remove = useAIPanelStore((s) => s.removeContext);
  const { type, id, label } = context;
  useEffect(() => {
    const ctx = { type, id, label };
    push(ctx);
    return () => remove(ctx);
  }, [type, id, label, push, remove]);
}
