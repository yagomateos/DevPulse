import { ROLES, type Role } from '@/types/domain';

/**
 * Stateless session token: base64url(JSON payload) + "." + HMAC-SHA256.
 * Uses only Web Crypto so it runs in the proxy, route handlers and Node.
 */

export const SESSION_COOKIE = 'aiw_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export interface SessionPayload {
  sub: string;
  role: Role;
  /** Issued at / expires at, epoch seconds. */
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true') {
    throw new Error('AUTH_SECRET must be set in production');
  }
  return value ?? 'dev-only-insecure-secret-change-me';
}

function base64url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data))));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(payload: Omit<SessionPayload, 'iat' | 'exp'>, ttlSeconds = SESSION_TTL_SECONDS, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const body = base64url(encoder.encode(JSON.stringify({ ...payload, iat, exp: iat + ttlSeconds })));
  return `${body}.${await hmac(body)}`;
}

export type VerifyResult = { status: 'valid'; session: SessionPayload } | { status: 'expired' } | { status: 'invalid' };

export async function verifySession(token: string | undefined, now = Date.now()): Promise<VerifyResult> {
  if (!token) return { status: 'invalid' };
  const [body, signature] = token.split('.');
  if (!body || !signature || !safeEqual(signature, await hmac(body))) return { status: 'invalid' };
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64url(body))) as SessionPayload;
    if (!payload.sub || !ROLES.includes(payload.role)) return { status: 'invalid' };
    if (payload.exp * 1000 <= now) return { status: 'expired' };
    return { status: 'valid', session: payload };
  } catch {
    return { status: 'invalid' };
  }
}
