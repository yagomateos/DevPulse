'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Current time that re-renders subscribers every `intervalMs` (shared timer per interval). */
const timers = new Map<number, { listeners: Set<() => void>; id: number; now: number }>();

function subscribe(intervalMs: number, listener: () => void) {
  let timer = timers.get(intervalMs);
  if (!timer) {
    const created = { listeners: new Set<() => void>(), id: 0, now: initial.get(intervalMs) ?? Date.now() };
    created.id = window.setInterval(() => {
      created.now = Date.now();
      created.listeners.forEach((l) => l());
    }, intervalMs);
    timers.set(intervalMs, created);
    timer = created;
  }
  timer.listeners.add(listener);
  return () => {
    timer.listeners.delete(listener);
    if (timer.listeners.size === 0) {
      window.clearInterval(timer.id);
      timers.delete(intervalMs);
    }
  };
}

// getSnapshot must be stable between calls (useSyncExternalStore re-renders on
// every change), so the pre-subscription value is captured once per interval.
const initial = new Map<number, number>();

function getSnapshot(intervalMs: number) {
  const timer = timers.get(intervalMs);
  if (timer) return timer.now;
  if (!initial.has(intervalMs)) initial.set(intervalMs, Date.now());
  return initial.get(intervalMs)!;
}

export function useNow(intervalMs = 60_000) {
  const subscribeToInterval = useCallback((listener: () => void) => subscribe(intervalMs, listener), [intervalMs]);
  return useSyncExternalStore(
    subscribeToInterval,
    () => getSnapshot(intervalMs),
    () => 0,
  );
}
