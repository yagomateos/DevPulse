import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { SessionProvider } from '@/features/auth/components/session-provider';
import { WorkspacePreferencesProvider } from '@/features/settings/components/workspace-preferences-provider';
import { getSession } from '@/server/auth/session';
import { isDemoMode } from '@/server/config';
import { getRepository } from '@/server/repositories';

/**
 * Authoritative auth check (the proxy only does an optimistic cookie check).
 * The user and workspace preferences are resolved once on the server and
 * handed to the client.
 */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?reason=expired');
  const { general } = await (await getRepository()).settings.get();
  return (
    <SessionProvider user={session.user} expiresAt={session.expiresAt}>
      <WorkspacePreferencesProvider value={{ timeZone: general.timezone, demoMode: isDemoMode() }}>
        <AppShell>{children}</AppShell>
      </WorkspacePreferencesProvider>
    </SessionProvider>
  );
}
