import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { GithubSyncNotice } from '@/features/pull-requests/components/github-sync-notice';
import { PullRequestTable } from '@/features/pull-requests/components/pull-request-table';
import { getRepository } from '@/server/repositories';

export const metadata: Metadata = { title: 'Pull requests' };

export default async function PullRequestsPage() {
  const { integrations } = await (await getRepository()).settings.get();
  return (
    <div className="space-y-6">
      <PageHeader title="Pull requests" description="Every open and recent pull request across projects, ranked by risk." />
      {!integrations.github.connected && <GithubSyncNotice />}
      <PullRequestTable />
    </div>
  );
}
