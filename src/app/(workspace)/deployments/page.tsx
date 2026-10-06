import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { DeploymentTable } from '@/features/deployments/components/deployment-table';

export const metadata: Metadata = { title: 'Deployments' };

export default function DeploymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Deployments" description="Releases across every environment. Select a row for a quick preview." />
      <DeploymentTable />
    </div>
  );
}
