import { GithubSyncNotice } from '@/features/pull-requests/components/github-sync-notice';
import { PullRequestTable } from '@/features/pull-requests/components/pull-request-table';
import { getRepository } from '@/server/repositories';

export default async function ProjectPullRequestsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { integrations } = await (await getRepository()).settings.get();
  return (
    <div className="space-y-4">
      {!integrations.github.connected && <GithubSyncNotice />}
      <PullRequestTable projectId={projectId} />
    </div>
  );
}
