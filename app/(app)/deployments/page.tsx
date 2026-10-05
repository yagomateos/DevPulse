import { DeploymentTable } from '@/components/deployments/deployment-table';

export default function DeploymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deployments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All deployments across your projects
        </p>
      </div>
      <DeploymentTable />
    </div>
  );
}
