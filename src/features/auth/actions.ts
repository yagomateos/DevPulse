'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { ROLES, type Role } from '@/types/domain';
import { verifyPassword } from '@/server/auth/credentials';
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure } from '@/server/auth/rate-limit';
import { createSession, destroySession, getSession } from '@/server/auth/session';
import { isDemoMode } from '@/server/config';
import { getRepository } from '@/server/repositories';

export type LoginResult = { ok: true; redirectTo: string } | { ok: false; error: string; fieldErrors?: Partial<Record<keyof LoginInput, string>> };

const LANDING_PATHS = { dashboard: '/dashboard', projects: '/projects', ai: '/ai' } as const;

/** Only allow same-origin, absolute-path redirects (prevents open redirects). */
function safeRedirect(next: string | null | undefined, fallback: string) {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}

export async function login(input: LoginInput, next?: string | null): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]));
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors };
  }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limitKey = `${parsed.data.email.toLowerCase()}|${ip}`;
  const limit = checkLoginAllowed(limitKey);
  if (!limit.allowed) return { ok: false, error: `Too many failed attempts. Try again in ${limit.retryAfterSeconds}s.` };

  // Constant-ish delay so success and failure take similar time.
  await new Promise((r) => setTimeout(r, 300));

  const repo = await getRepository();
  const member = (await repo.team.list()).find((m) => m.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!member || member.status !== 'active' || !verifyPassword(member.id, parsed.data.password)) {
    recordLoginFailure(limitKey);
    return { ok: false, error: 'Invalid email or password.' };
  }
  clearLoginFailures(limitKey);

  // Outside demo mode the role always comes from the member record.
  const role = isDemoMode() && parsed.data.role ? parsed.data.role : member.role;
  await createSession(member.id, role);
  const { general } = await repo.settings.get();
  return { ok: true, redirectTo: safeRedirect(next, LANDING_PATHS[general.defaultLanding]) };
}

export async function logout() {
  await destroySession();
  redirect('/login');
}

/** Demo only: re-issue the session with another role to explore RBAC. */
export async function switchRole(role: Role) {
  if (!isDemoMode()) throw new Error('Role switching is only available in demo mode.');
  const session = await getSession();
  if (!session) redirect('/login?reason=expired');
  if (!ROLES.includes(role)) throw new Error('Unknown role');
  await createSession(session.user.id, role);
}

/** Demo only: shorten the current session so the expiry flow can be observed. */
export async function expireSessionSoon(seconds = 10) {
  if (!isDemoMode()) throw new Error('Session simulation is only available in demo mode.');
  const session = await getSession();
  if (!session) redirect('/login?reason=expired');
  await createSession(session.user.id, session.user.role, Math.min(Math.max(seconds, 5), 60));
  return { expiresAt: Date.now() + seconds * 1000 };
}
