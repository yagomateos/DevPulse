import { GithubSyncNotice } from '@/features/pull-requests/components/github-sync-notice';
import { PullRequestTable } from '@/features/pull-requests/components/pull-request-table';
import { SyncPullRequestsButton } from '@/features/pull-requests/components/sync-pull-requests-button';
import { getRepository } from '@/server/repositories';

export default async function ProjectPullRequestsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { integrations } = await (await getRepository()).settings.get();
  return (
    <div className="space-y-4">
      {integrations.github.connected ? (
        <div className="flex justify-end">
          <SyncPullRequestsButton projectId={projectId} />
        </div>
      ) : (
        <GithubSyncNotice />
      )}
      <PullRequestTable projectId={projectId} />
    </div>
  );
}
