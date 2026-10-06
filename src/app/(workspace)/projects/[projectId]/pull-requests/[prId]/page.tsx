import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PullRequestDetail } from '@/features/pull-requests/components/pull-request-detail';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';

type Props = { params: Promise<{ projectId: string; prId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId, prId } = await params;
  const pr = await (await getRepository()).pullRequests.get(projectId, Number(prId));
  return { title: pr ? `#${pr.number} ${pr.title}` : 'Pull request not found' };
}

export default async function PullRequestPage({ params }: Props) {
  const { projectId, prId } = await params;
  const number = Number(prId);
  if (!Number.isInteger(number)) notFound();
  const repo = await getRepository();
  const [pr, analysis] = await Promise.all([repo.pullRequests.get(projectId, number), repo.aiAnalyses.latest('pull_request', `${projectId}#${number}`)]);
  if (!pr) notFound();
  return (
    <Hydrate
      queries={[
        [queryKeys.pullRequests.detail(projectId, number), pr],
        [queryKeys.ai.analysis('pull_request', projectId, prId), analysis],
      ]}
    >
      <PullRequestDetail projectId={projectId} number={number} />
    </Hydrate>
  );
}
