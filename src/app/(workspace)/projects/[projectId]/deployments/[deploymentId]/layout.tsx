import { notFound } from 'next/navigation';
import { getDeployment } from '@/server/queries';

/** Validates existence above this segment's loading.tsx so a missing deployment returns HTTP 404. */
export default async function DeploymentLayout({ params, children }: { params: Promise<{ projectId: string; deploymentId: string }>; children: React.ReactNode }) {
  const { projectId, deploymentId } = await params;
  if (!(await getDeployment(projectId, Number(deploymentId)))) notFound();
  return children;
}
