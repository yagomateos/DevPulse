import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DeploymentDetail } from '@/features/deployments/components/deployment-detail';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';
import { getDeployment } from '@/server/queries';

type Props = { params: Promise<{ projectId: string; deploymentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Deployment #${(await params).deploymentId}` };
}

export default async function DeploymentPage({ params }: Props) {
  const { projectId, deploymentId } = await params;
  const number = Number(deploymentId);
  if (!Number.isInteger(number)) notFound();
  const repo = await getRepository();
  const [deployment, analysis] = await Promise.all([getDeployment(projectId, number), repo.aiAnalyses.latest('deployment', `${projectId}~${number}`)]);
  if (!deployment) notFound();
  return (
    <Hydrate
      queries={[
        [queryKeys.deployments.detail(projectId, number), deployment],
        [queryKeys.ai.analysis('deployment', projectId, deploymentId), analysis],
      ]}
    >
      <DeploymentDetail projectId={projectId} number={number} />
    </Hydrate>
  );
}
