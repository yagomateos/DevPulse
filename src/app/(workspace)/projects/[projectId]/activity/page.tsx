import { Card } from '@/components/ui/card';
import { ActivityFeed } from '@/features/dashboard/components/activity-feed';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';

export default async function ProjectActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const activity = await (await getRepository()).analytics.activity({ projectId, limit: 40 });
  return (
    <Card className="p-3">
      <Hydrate queries={[[queryKeys.activity(projectId, 40), activity]]}>
        <ActivityFeed projectId={projectId} limit={40} />
      </Hydrate>
    </Card>
  );
}
