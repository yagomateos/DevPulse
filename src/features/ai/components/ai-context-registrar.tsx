'use client';

import type { AIContext } from '@/schemas/ai';
import { useRegisterAIContext } from '../hooks/use-register-ai-context';

/** Render-nothing bridge so Server Components can register AI context. */
export function AIContextRegistrar(context: AIContext) {
  useRegisterAIContext(context);
  return null;
}
