import 'server-only';
import type { TeamMember } from '@/types/domain';
import { createInviteToken, hashInviteToken, hashPassword } from '../auth/password';
import { escapeHtml, sendEmail, type EmailMessage } from '../email/send';
import type { Invitation, Repository } from '../repositories';

/**
 * Team invitations: a single-use, expiring link sent by email. The raw token
 * exists only in the link; the database keeps its SHA-256, and issuing a new
 * invitation revokes the previous one.
 */

export const INVITATION_TTL_DAYS = 7;

export interface IssuedInvitation {
  link: string;
  expiresAt: string;
  emailDelivered: boolean;
  /** Why the email didn't go out, for the inviter (the link still works and can be shared by hand). */
  emailProblem?: 'not-configured' | 'rejected';
}

export function invitationEmail({ to, name, inviter, role, link }: { to: string; name: string; inviter: string; role: string; link: string }): EmailMessage {
  const roleWord = role.charAt(0) + role.slice(1).toLowerCase();
  return {
    to,
    subject: `${inviter} invited you to DevPulse`,
    text: `Hi ${name},\n\n${inviter} invited you to join their DevPulse workspace as ${roleWord}.\n\nAccept the invitation and choose your password:\n${link}\n\nThe link works once and expires in ${INVITATION_TTL_DAYS} days. If you weren't expecting it, ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#18181b">
<h1 style="font-size:18px">Join ${escapeHtml(inviter)} on DevPulse</h1>
<p>Hi ${escapeHtml(name)}, you've been invited to the workspace as <strong>${escapeHtml(roleWord)}</strong>.</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#3b4fd8;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Accept invitation</a></p>
<p style="font-size:13px;color:#52525b">The link works once and expires in ${INVITATION_TTL_DAYS} days. If you weren't expecting it, ignore this email.</p>
</div>`,
  };
}

export async function issueInvitation(repo: Repository, member: TeamMember, inviter: { id: string; name: string }, appUrl: string): Promise<IssuedInvitation> {
  const { token, tokenHash } = createInviteToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000).toISOString();
  await repo.invitations.create({ userId: member.id, tokenHash, invitedBy: inviter.id, expiresAt });
  const link = `${appUrl.replace(/\/$/, '')}/invite/${token}`;
  const email = await sendEmail(invitationEmail({ to: member.email, name: member.name, inviter: inviter.name, role: member.role, link }));
  return email.delivered ? { link, expiresAt, emailDelivered: true } : { link, expiresAt, emailDelivered: false, emailProblem: email.reason };
}

export type InvitationLookup = { status: 'valid'; invitation: Invitation; member: TeamMember } | { status: 'invalid' | 'expired' | 'accepted' };

export async function lookupInvitation(repo: Repository, token: string, now = Date.now()): Promise<InvitationLookup> {
  if (!/^[\w-]{43}$/.test(token)) return { status: 'invalid' };
  const invitation = await repo.invitations.findByTokenHash(hashInviteToken(token));
  if (!invitation) return { status: 'invalid' };
  if (invitation.acceptedAt) return { status: 'accepted' };
  // Date.parse, not string comparison: Postgres returns "2026-10-13 18:00:00+00".
  if (Date.parse(invitation.expiresAt) <= now) return { status: 'expired' };
  const member = await repo.team.get(invitation.userId);
  return member ? { status: 'valid', invitation, member } : { status: 'invalid' };
}

export async function acceptInvitation(repo: Repository, token: string, password: string): Promise<{ ok: true; member: TeamMember } | { ok: false; status: 'invalid' | 'expired' | 'accepted' }> {
  const found = await lookupInvitation(repo, token);
  if (found.status !== 'valid') return { ok: false, status: found.status };
  const member = await repo.invitations.accept(found.invitation.id, await hashPassword(password));
  return member ? { ok: true, member } : { ok: false, status: 'accepted' };
}

/** Where invitation links point. APP_URL pins it in production; otherwise the request's own origin. */
export function appUrlFor(request: Request) {
  return process.env.APP_URL ?? new URL(request.url).origin;
}
