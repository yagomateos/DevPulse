// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyPassword } from '../auth/credentials';
import { createMemoryRepository, resetMemoryStore } from '../repositories/memory-repository';
import { acceptInvitation, invitationEmail, issueInvitation, lookupInvitation } from './invitations';

const inviter = { id: 'usr_alex', name: 'Alex Chen' };
const tokenOf = (link: string) => link.split('/invite/')[1]!;

async function setup() {
  const repo = createMemoryRepository();
  const member = await repo.team.invite({ name: 'Sam Rivera', email: 'sam@example.com', role: 'DEVELOPER' });
  return { repo, member };
}

describe('team invitations', () => {
  beforeEach(() => resetMemoryStore());
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('creates a working link but reports that email is not configured without RESEND_API_KEY', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { repo, member } = await setup();

    const issued = await issueInvitation(repo, member, inviter, 'https://devpulse.test/');
    expect(issued).toMatchObject({ emailDelivered: false, emailProblem: 'not-configured' });
    expect(issued.link).toMatch(/^https:\/\/devpulse\.test\/invite\/[\w-]{43}$/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await lookupInvitation(repo, tokenOf(issued.link))).toMatchObject({ status: 'valid', member: { email: 'sam@example.com' } });
  });

  it('sends the email through Resend when configured', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('EMAIL_FROM', 'DevPulse <team@devpulse.test>');
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ id: 'email_1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const { repo, member } = await setup();

    const issued = await issueInvitation(repo, member, inviter, 'https://devpulse.test');
    expect(issued.emailDelivered).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer re_test' });
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ from: 'DevPulse <team@devpulse.test>', to: ['sam@example.com'], subject: 'Alex Chen invited you to DevPulse' });
    expect(body.html).toContain(issued.link);
  });

  it('reports a rejected email without failing the invitation', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'domain not verified' }), { status: 403 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { repo, member } = await setup();
    const issued = await issueInvitation(repo, member, inviter, 'https://devpulse.test');
    expect(issued).toMatchObject({ emailDelivered: false, emailProblem: 'rejected' });
    expect((await lookupInvitation(repo, tokenOf(issued.link))).status).toBe('valid');
  });

  it('accepting activates the member with their own password, exactly once', async () => {
    const { repo, member } = await setup();
    const token = tokenOf((await issueInvitation(repo, member, inviter, 'https://devpulse.test')).link);

    const accepted = await acceptInvitation(repo, token, 'Sam-password-42');
    expect(accepted).toMatchObject({ ok: true, member: { id: member.id, status: 'active' } });
    expect(await verifyPassword(repo, member.id, 'Sam-password-42')).toBe(true);
    expect(await verifyPassword(repo, member.id, 'demo123')).toBe(false);

    expect(await acceptInvitation(repo, token, 'Another-pass-1')).toEqual({ ok: false, status: 'accepted' });
    expect(await verifyPassword(repo, member.id, 'Sam-password-42')).toBe(true);
  });

  it('rejects expired, unknown and replaced links', async () => {
    const { repo, member } = await setup();
    const first = tokenOf((await issueInvitation(repo, member, inviter, 'https://devpulse.test')).link);
    expect((await lookupInvitation(repo, first, Date.now() + 8 * 86_400_000)).status).toBe('expired');
    expect((await lookupInvitation(repo, 'not-a-token')).status).toBe('invalid');
    expect((await lookupInvitation(repo, 'x'.repeat(43))).status).toBe('invalid');

    const second = tokenOf((await issueInvitation(repo, member, inviter, 'https://devpulse.test')).link);
    expect((await lookupInvitation(repo, first)).status).toBe('invalid');
    expect((await lookupInvitation(repo, second)).status).toBe('valid');
  });

  it('escapes user-provided names in the email HTML', () => {
    const email = invitationEmail({ to: 'x@example.com', name: '<img src=x onerror=alert(1)>', inviter: 'Eve "the" <b>admin</b>', role: 'DEVELOPER', link: 'https://devpulse.test/invite/abc' });
    expect(email.html).not.toContain('<img');
    expect(email.html).not.toContain('<b>admin');
    expect(email.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
