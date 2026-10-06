import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

const isBrowserLike = typeof window !== 'undefined';

if (isBrowserLike) {
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => cleanup());

  // jsdom gaps used by Radix, cmdk and our hooks.
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({ matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }),
    });
  }
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= vi.fn();
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
}

// App Router hooks backed by window.location (see next-navigation-mock.ts).
vi.mock('next/navigation', async () => (await import('./next-navigation-mock')).navigationMock);
