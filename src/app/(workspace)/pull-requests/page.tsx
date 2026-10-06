import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { PullRequestTable } from '@/features/pull-requests/components/pull-request-table';

export const metadata: Metadata = { title: 'Pull requests' };

export default function PullRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pull requests" description="Every open and recent pull request across projects, ranked by risk." />
      <PullRequestTable />
    </div>
  );
}
