'use server';

import { redirect } from 'next/navigation';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { ROLES, type Role } from '@/types/domain';
import { verifyPassword } from '@/server/auth/credentials';
import { createSession, destroySession, getSession } from '@/server/auth/session';
import { getRepository } from '@/server/repositories';

export type LoginResult = { ok: true; redirectTo: string } | { ok: false; error: string; fieldErrors?: Partial<Record<keyof LoginInput, string>> };

/** Only allow same-origin, absolute-path redirects (prevents open redirects). */
function safeRedirect(next: string | null | undefined) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

export async function login(input: LoginInput, next?: string | null): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]));
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors };
  }
  // Constant-ish delay so success and failure take similar time.
  await new Promise((r) => setTimeout(r, 400));

  const repo = await getRepository();
  const member = (await repo.team.list()).find((m) => m.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!member || !verifyPassword(member.id, parsed.data.password) || member.status !== 'active') {
    return { ok: false, error: 'Invalid email or password.' };
  }
  await createSession(member.id, parsed.data.role);
  return { ok: true, redirectTo: safeRedirect(next) };
}

export async function logout() {
  await destroySession();
  redirect('/login');
}

/** Demo-only: re-issue the session with another role to explore RBAC. */
export async function switchRole(role: Role) {
  const session = await getSession();
  if (!session) redirect('/login?reason=expired');
  if (!ROLES.includes(role)) throw new Error('Unknown role');
  await createSession(session.user.id, role);
}

/** Demo-only: shorten the current session so the expiry flow can be observed. */
export async function expireSessionSoon(seconds = 10) {
  const session = await getSession();
  if (!session) redirect('/login?reason=expired');
  await createSession(session.user.id, session.user.role, seconds);
  return { expiresAt: Date.now() + seconds * 1000 };
}
