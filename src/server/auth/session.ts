import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { can, type Permission } from '@/lib/permissions';
import type { Role, User } from '@/types/domain';
import { getRepository } from '../repositories';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession, type SessionPayload } from './token';

export interface Session {
  user: User;
  expiresAt: number;
}

/**
 * Resolves the current session once per request (React `cache`), so layouts,
 * pages and server actions can all call it without repeated work.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const result = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (result.status !== 'valid') return null;
  const repo = await getRepository();
  const member = await repo.team.get(result.session.sub);
  if (!member) return null;
  const user: User = { id: member.id, name: member.name, email: member.email, title: member.title, role: result.session.role };
  return { user, expiresAt: result.session.exp * 1000 };
});

export async function createSession(userId: string, role: Role, ttlSeconds = SESSION_TTL_SECONDS) {
  const token = await signSession({ sub: userId, role }, ttlSeconds);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== 'true',
    path: '/',
    maxAge: ttlSeconds,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'Your session has expired. Sign in again.');
  return session;
}

export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireSession();
  if (!can(session.user.role, permission)) {
    throw new HttpError(403, `Your role (${session.user.role}) is not allowed to perform this action.`);
  }
  return session;
}

export type { SessionPayload };
