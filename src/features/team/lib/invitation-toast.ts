import { toast } from 'sonner';
import type { InvitationResult } from '@/services/team';

const PROBLEM = {
  'not-configured': 'Email delivery is not configured on this server.',
  rejected: 'The email provider rejected the message.',
} as const;

/**
 * One message for invite and resend. When the email can't go out the link is
 * still valid, so the inviter gets it to share by hand instead of a dead end.
 */
export function notifyInvitation({ member, invitation }: InvitationResult) {
  if (invitation.emailDelivered) {
    toast.success('Invitation emailed', { description: `${member.name} will receive a link at ${member.email}. It expires in 7 days.` });
    return;
  }
  toast.warning('Invitation created, but the email was not sent', {
    description: `${invitation.emailProblem ? PROBLEM[invitation.emailProblem] : ''} Copy the link and send it to ${member.name} yourself.`,
    duration: 30_000,
    action: {
      label: 'Copy link',
      onClick: () =>
        navigator.clipboard.writeText(invitation.link).then(
          () => toast.success('Invitation link copied'),
          () => toast.error('Could not copy the link'),
        ),
    },
  });
}
