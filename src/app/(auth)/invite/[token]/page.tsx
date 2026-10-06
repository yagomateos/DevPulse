import type { Metadata } from 'next';
import { Clock, LinkIcon, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AcceptInvitationForm } from '@/features/auth/components/accept-invitation-form';
import { getRepository } from '@/server/repositories';
import { lookupInvitation } from '@/server/team/invitations';

export const metadata: Metadata = { title: 'Accept invitation', referrer: 'no-referrer' };

const PROBLEMS = {
  invalid: { icon: LinkIcon, title: 'This invitation link is not valid', body: 'It may have been replaced by a newer invitation. Ask your workspace admin to send a new one.' },
  expired: { icon: Clock, title: 'This invitation has expired', body: 'Invitations are valid for 7 days. Ask your workspace admin to send a new one.' },
  accepted: { icon: MailCheck, title: 'This invitation was already used', body: 'Your account is active. Sign in with your email and password.' },
} as const;

/** Public page (see proxy.ts): the token in the URL is the credential. */
export default async function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await lookupInvitation(await getRepository(), token);
  const problem = found.status === 'valid' ? null : PROBLEMS[found.status];

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <Logo />
        {found.status === 'valid' ? (
          <>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">Join the workspace</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {found.member.name}. Choose a password for <span className="font-medium text-foreground">{found.member.email}</span> to join as{' '}
                {found.member.role.charAt(0) + found.member.role.slice(1).toLowerCase()}.
              </p>
            </div>
            <AcceptInvitationForm token={token} email={found.member.email} />
          </>
        ) : (
          <>
            <Alert>
              {problem && <problem.icon className="size-4" />}
              <AlertTitle>{problem?.title}</AlertTitle>
              <AlertDescription>{problem?.body}</AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Go to sign in</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
