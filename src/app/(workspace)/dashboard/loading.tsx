import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-64" />
      <LoadingSkeleton variant="metrics" rows={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <LoadingSkeleton variant="chart" />
        <LoadingSkeleton variant="chart" />
      </div>
    </div>
  );
}
