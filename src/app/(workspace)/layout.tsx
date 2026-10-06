import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { SessionProvider } from '@/features/auth/components/session-provider';
import { WorkspacePreferencesProvider } from '@/features/settings/components/workspace-preferences-provider';
import { queryKeys } from '@/lib/query-keys';
import { getSession } from '@/server/auth/session';
import { isDemoMode } from '@/server/config';
import { Hydrate } from '@/server/hydrate';
import { getSettings } from '@/server/queries';
import { getRepository } from '@/server/repositories';

/**
 * Authoritative auth check (the proxy only does an optimistic cookie check).
 * The user, workspace preferences and the project list (needed by the sidebar
 * on every page) are resolved once on the server and handed to the client.
 */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?reason=expired');
  const [{ general }, projects] = await Promise.all([getSettings(), (await getRepository()).projects.list()]);
  return (
    <SessionProvider user={session.user} expiresAt={session.expiresAt}>
      <WorkspacePreferencesProvider value={{ timeZone: general.timezone, demoMode: isDemoMode() }}>
        {/* Hydrated above the shell so the sidebar never creates a pending projects query during SSR. */}
        <Hydrate queries={[[queryKeys.projects.list(), projects]]}>
          <AppShell>{children}</AppShell>
        </Hydrate>
      </WorkspacePreferencesProvider>
    </SessionProvider>
  );
}
