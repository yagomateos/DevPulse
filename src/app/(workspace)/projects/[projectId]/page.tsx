import { ActivityFeed } from '@/features/dashboard/components/activity-feed';
import { DeploymentList } from '@/features/dashboard/components/deployment-list';
import { IncidentList } from '@/features/dashboard/components/incident-list';
import { SectionCard } from '@/features/dashboard/components/section-card';
import { RiskyPullRequests } from '@/features/pull-requests/components/risky-pull-requests';

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const base = `/projects/${projectId}`;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <SectionCard title="Riskiest open pull requests" description="Sorted by AI risk score" href={`${base}/pull-requests?status=open,draft&sort=risk.desc`}>
          <RiskyPullRequests projectId={projectId} />
        </SectionCard>
        <SectionCard title="Recent deployments" href={`${base}/deployments`}>
          <DeploymentList projectId={projectId} />
        </SectionCard>
      </div>
      <div className="space-y-4">
        <SectionCard title="Active incidents" href={`${base}/incidents`}>
          <IncidentList projectId={projectId} />
        </SectionCard>
        <SectionCard title="Activity" href={`${base}/activity`}>
          <ActivityFeed projectId={projectId} limit={6} />
        </SectionCard>
      </div>
    </div>
  );
}
