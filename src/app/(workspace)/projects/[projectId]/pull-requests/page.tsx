import { PullRequestTable } from '@/features/pull-requests/components/pull-request-table';

export default async function ProjectPullRequestsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <PullRequestTable projectId={projectId} />;
}
