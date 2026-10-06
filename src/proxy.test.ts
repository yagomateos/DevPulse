// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';
import { SESSION_COOKIE, signSession } from './server/auth/token';

const request = (path: string, cookie?: string) => {
  const r = new NextRequest(new URL(path, 'http://app.test'));
  if (cookie) r.cookies.set(SESSION_COOKIE, cookie);
  return r;
};

describe('proxy (route protection)', () => {
  it('redirects anonymous page requests to login, preserving the destination', async () => {
    const res = await proxy(request('/projects/orion-gateway?tab=files'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://app.test/login?next=%2Fprojects%2Forion-gateway%3Ftab%3Dfiles');
  });

  it('answers API requests with 401 JSON instead of redirecting', async () => {
    const res = await proxy(request('/api/projects'));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: { status: 401 } });
  });

  it('flags expired sessions and clears the cookie', async () => {
    const expired = await signSession({ sub: 'usr_alex', role: 'ADMIN' }, 60, Date.now() - 120_000);
    const res = await proxy(request('/dashboard', expired));
    expect(res.headers.get('location')).toContain('reason=expired');
    expect(res.headers.get('set-cookie')).toContain(`${SESSION_COOKIE}=;`);
  });

  it('lets valid sessions through and bounces them away from /login', async () => {
    const token = await signSession({ sub: 'usr_alex', role: 'ADMIN' });
    expect((await proxy(request('/dashboard', token))).headers.get('x-middleware-next')).toBe('1');
    expect((await proxy(request('/login', token))).headers.get('location')).toBe('http://app.test/');
  });

  it('keeps public endpoints public', async () => {
    expect((await proxy(request('/api/health'))).headers.get('x-middleware-next')).toBe('1');
  });
});
