import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { IncidentTable } from '@/features/incidents/components/incident-table';

export const metadata: Metadata = { title: 'Incidents' };

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Incidents" description="Declare, track and investigate production incidents." />
      <IncidentTable />
    </div>
  );
}
