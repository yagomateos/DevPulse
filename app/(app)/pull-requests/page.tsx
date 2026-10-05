import { PRTable } from '@/components/pull-requests/pr-table';

export default function PullRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pull Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All pull requests across your projects
        </p>
      </div>
      <PRTable />
    </div>
  );
}
