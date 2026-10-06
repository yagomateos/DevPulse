import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IncidentDetail } from '@/features/incidents/components/incident-detail';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';

type Props = { params: Promise<{ projectId: string; incidentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const incident = await (await getRepository()).incidents.get((await params).incidentId);
  return { title: incident ? `${incident.reference} ${incident.title}` : 'Incident not found' };
}

export default async function IncidentPage({ params }: Props) {
  const { projectId, incidentId } = await params;
  const repo = await getRepository();
  const [incident, analysis] = await Promise.all([repo.incidents.get(incidentId), repo.aiAnalyses.latest('incident', incidentId)]);
  if (!incident || incident.projectId !== projectId) notFound();
  return (
    <Hydrate
      queries={[
        [queryKeys.incidents.detail(incidentId), incident],
        [queryKeys.ai.analysis('incident', projectId, incidentId), analysis],
      ]}
    >
      <IncidentDetail projectId={projectId} incidentId={incidentId} />
    </Hydrate>
  );
}
