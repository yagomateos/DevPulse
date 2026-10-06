import 'server-only';

/**
 * Transactional email through Resend's REST API (fetch, no SDK). Without
 * RESEND_API_KEY nothing is sent and callers get `not-configured`, so local
 * development and CI never email anyone. EMAIL_FROM must use a domain verified
 * in Resend; the default sandbox sender only delivers to the account owner.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type EmailResult = { delivered: true; id: string } | { delivered: false; reason: 'not-configured' | 'rejected'; detail?: string };

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { delivered: false, reason: 'not-configured' };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? 'DevPulse <onboarding@resend.dev>', to: [message.to], subject: message.subject, html: message.html, text: message.text }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!response.ok || !body?.id) {
      console.error(`[email] Resend rejected the message (${response.status})`, body?.message);
      return { delivered: false, reason: 'rejected', detail: body?.message };
    }
    return { delivered: true, id: body.id };
  } catch (error) {
    console.error('[email] Resend request failed', error);
    return { delivered: false, reason: 'rejected', detail: error instanceof Error ? error.message : undefined };
  }
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Names in templates are user input: escape them so an invite can't inject markup into the email. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);
}
