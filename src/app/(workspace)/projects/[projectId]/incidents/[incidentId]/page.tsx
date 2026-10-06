import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IncidentDetail } from '@/features/incidents/components/incident-detail';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';
import { getIncident } from '@/server/queries';

type Props = { params: Promise<{ projectId: string; incidentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const incident = await getIncident((await params).incidentId);
  return { title: incident ? `${incident.reference} ${incident.title}` : 'Incident not found' };
}

export default async function IncidentPage({ params }: Props) {
  const { projectId, incidentId } = await params;
  const repo = await getRepository();
  const [incident, analysis] = await Promise.all([getIncident(incidentId), repo.aiAnalyses.latest('incident', incidentId)]);
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
