import { useMemo, useSyncExternalStore } from 'react';
import { vi } from 'vitest';

/** Minimal App Router mock backed by window.location so URL-state hooks work in jsdom. */
export const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() };
export const paramsMock: { current: Record<string, string> } = { current: {} };

const listeners = new Set<() => void>();
for (const method of ['replaceState', 'pushState'] as const) {
  const original = window.history[method].bind(window.history);
  window.history[method] = (...args: Parameters<History['replaceState']>) => {
    original(...args);
    listeners.forEach((l) => l());
  };
}

function useSearchParams() {
  const search = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => window.location.search,
    () => '',
  );
  return useMemo(() => new URLSearchParams(search), [search]);
}

export const navigationMock = {
  useRouter: () => routerMock,
  usePathname: () => window.location.pathname,
  useParams: () => paramsMock.current,
  useSearchParams,
  redirect: vi.fn(),
  notFound: vi.fn(),
};
