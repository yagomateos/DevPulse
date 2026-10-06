'use client';

import { useEffect, useRef } from 'react';

type Handler = (event: KeyboardEvent) => void;

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

/**
 * Global keyboard shortcuts. Supports modifier combos ("mod+k" = ⌘K / Ctrl+K)
 * and two-key sequences ("g d"). Sequences are ignored while typing.
 */
export function useHotkeys(bindings: Record<string, Handler>, enabled = true) {
  const ref = useRef(bindings);
  useEffect(() => {
    ref.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return;
    let prefix: string | null = null;
    let timer: number | undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;
      if (mod) {
        const handler = ref.current[`mod+${key}`];
        if (handler) {
          event.preventDefault();
          handler(event);
        }
        return;
      }
      if (event.altKey || isTypingTarget(event.target)) return;
      if (prefix) {
        const handler = ref.current[`${prefix} ${key}`];
        prefix = null;
        window.clearTimeout(timer);
        if (handler) {
          event.preventDefault();
          handler(event);
        }
        return;
      }
      if (Object.keys(ref.current).some((k) => k.startsWith(`${key} `))) {
        prefix = key;
        timer = window.setTimeout(() => (prefix = null), 1000);
        return;
      }
      ref.current[key]?.(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [enabled]);
}
