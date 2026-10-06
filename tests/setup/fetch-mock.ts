import { vi } from 'vitest';
import { jsonResponse } from './render';

type Handler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

/** Routes fetch calls by "METHOD /path" so component tests exercise the real services layer. */
export function mockFetch(routes: Record<string, Handler | unknown>) {
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const key = `${(init?.method ?? 'GET').toUpperCase()} ${url.pathname}`;
    const route = routes[key];
    if (route === undefined) return jsonResponse({ error: { message: `Unmocked ${key}`, status: 404 } }, 404);
    return typeof route === 'function' ? (route as Handler)(url, init) : jsonResponse(route);
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}
