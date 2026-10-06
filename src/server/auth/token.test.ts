import { describe, expect, it } from 'vitest';
import { signSession, verifySession } from './token';

describe('session token', () => {
  it('round-trips a valid session', async () => {
    const token = await signSession({ sub: 'usr_alex', role: 'MANAGER' });
    const result = await verifySession(token);
    expect(result).toMatchObject({ status: 'valid', session: { sub: 'usr_alex', role: 'MANAGER' } });
  });

  it('rejects tampered payloads (e.g. role escalation)', async () => {
    const token = await signSession({ sub: 'usr_alex', role: 'DEVELOPER' });
    const [, signature] = token.split('.');
    const forged = btoa(JSON.stringify({ sub: 'usr_alex', role: 'ADMIN', iat: 0, exp: 9_999_999_999 })).replace(/=+$/, '');
    expect((await verifySession(`${forged}.${signature}`)).status).toBe('invalid');
  });

  it('reports expiry distinctly from invalid tokens', async () => {
    const token = await signSession({ sub: 'usr_alex', role: 'ADMIN' }, 60, Date.now() - 120_000);
    expect((await verifySession(token)).status).toBe('expired');
    expect((await verifySession(undefined)).status).toBe('invalid');
    expect((await verifySession('garbage')).status).toBe('invalid');
  });
});
