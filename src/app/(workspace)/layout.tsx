import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { SessionProvider } from '@/features/auth/components/session-provider';
import { getSession } from '@/server/auth/session';

/**
 * Authoritative auth check (the proxy only does an optimistic cookie check).
 * The user is resolved once on the server and handed to the client.
 */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?reason=expired');
  return (
    <SessionProvider user={session.user} expiresAt={session.expiresAt}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
