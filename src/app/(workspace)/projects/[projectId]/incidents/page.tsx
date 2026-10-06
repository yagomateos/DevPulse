import { IncidentTable } from '@/features/incidents/components/incident-table';

export default async function ProjectIncidentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <IncidentTable projectId={projectId} />;
}
