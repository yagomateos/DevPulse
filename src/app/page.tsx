import { redirect } from 'next/navigation';
import { getRepository } from '@/server/repositories';

const LANDING_PATHS = { dashboard: '/dashboard', projects: '/projects', ai: '/ai' } as const;

/** Sends signed-in users to the workspace's default landing page (Settings → General). */
export default async function Home() {
  const { general } = await (await getRepository()).settings.get();
  redirect(LANDING_PATHS[general.defaultLanding]);
}
