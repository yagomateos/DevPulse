import { notFound } from 'next/navigation';
import { getIncident } from '@/server/queries';

/** Validates existence (and project ownership) above loading.tsx so a missing incident returns HTTP 404. */
export default async function IncidentLayout({ params, children }: { params: Promise<{ projectId: string; incidentId: string }>; children: React.ReactNode }) {
  const { projectId, incidentId } = await params;
  const incident = await getIncident(incidentId);
  if (!incident || incident.projectId !== projectId) notFound();
  return children;
}
