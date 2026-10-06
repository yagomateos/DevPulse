import { notFound } from 'next/navigation';
import { getPullRequest } from '@/server/queries';

/** Validates existence above this segment's loading.tsx so a missing PR returns HTTP 404. */
export default async function PullRequestLayout({ params, children }: { params: Promise<{ projectId: string; prId: string }>; children: React.ReactNode }) {
  const { projectId, prId } = await params;
  if (!(await getPullRequest(projectId, Number(prId)))) notFound();
  return children;
}
