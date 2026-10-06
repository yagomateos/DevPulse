import { DeploymentTable } from '@/features/deployments/components/deployment-table';

export default async function ProjectDeploymentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <DeploymentTable projectId={projectId} />;
}
