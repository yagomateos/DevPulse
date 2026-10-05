import { IncidentTable } from '@/components/incidents/incident-table';

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All incidents across your projects
        </p>
      </div>
      <IncidentTable />
    </div>
  );
}
