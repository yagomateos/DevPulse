// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import { HttpError } from './auth/session';
import { parseBody, route } from './http';

const ok = route(async () => Response.json({ ok: true }));
const req = (url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) => new NextRequest(new URL(url, 'http://app.test'), init);

describe('route() wrapper', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('maps HttpError, ZodError and unknown errors to a uniform JSON body', async () => {
    vi.stubEnv('MOCK_NETWORK', 'off');
    const forbidden = await route(async () => {
      throw new HttpError(403, 'Nope');
    })(req('/x'), undefined);
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ error: { message: 'Nope', status: 403 } });

    const invalid = await route(async (r) => {
      await parseBody(r, z.object({ name: z.string().min(3, 'Too short') }));
      return Response.json({});
    })(req('/x', { method: 'POST', body: JSON.stringify({ name: 'a' }) }), undefined);
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({ error: { issues: [{ path: 'name', message: 'Too short' }] } });

    vi.spyOn(console, 'error').mockImplementation(() => {});
    const crash = await route(async () => {
      throw new Error('db exploded: secret details');
    })(req('/x'), undefined);
    expect(crash.status).toBe(500);
    expect(JSON.stringify(await crash.json())).not.toContain('secret');
  });

  it('rejects malformed JSON bodies', async () => {
    vi.stubEnv('MOCK_NETWORK', 'off');
    const res = await route(async (r) => {
      await parseBody(r, z.object({}));
      return Response.json({});
    })(req('/x', { method: 'POST', body: '{nope' }), undefined);
    expect(res.status).toBe(400);
  });

  it('blocks cross-origin mutations but allows same-origin and non-browser clients', async () => {
    vi.stubEnv('MOCK_NETWORK', 'off');
    const cross = await ok(req('/x', { method: 'POST', headers: { origin: 'https://evil.test', host: 'app.test' } }), undefined);
    expect(cross.status).toBe(403);
    const same = await ok(req('/x', { method: 'POST', headers: { origin: 'http://app.test', host: 'app.test' } }), undefined);
    expect(same.status).toBe(200);
    const cli = await ok(req('/x', { method: 'DELETE', headers: { host: 'app.test' } }), undefined);
    expect(cli.status).toBe(200);
  });

  it('honours the ?__fail=1 debug switch only in demo mode', async () => {
    vi.stubEnv('MOCK_NETWORK', '');
    vi.stubEnv('DEMO_MODE', 'true');
    // Instant latency keeps the test fast while still evaluating the failure switch.
    const { createMemoryRepository, resetMemoryStore } = await import('./repositories/memory-repository');
    resetMemoryStore();
    const repo = createMemoryRepository();
    const settings = await repo.settings.get();
    await repo.settings.update('general', { ...settings.general, network: { latency: 'instant', failureRate: '0' } });
    expect((await ok(req('/x?__fail=1'), undefined)).status).toBe(503);
    vi.stubEnv('DEMO_MODE', 'false');
    expect((await ok(req('/x?__fail=1'), undefined)).status).toBe(200);
  });
});
