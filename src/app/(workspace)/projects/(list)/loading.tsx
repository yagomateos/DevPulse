import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';

export default function Loading() {
  return <LoadingSkeleton variant="cards" rows={6} label="Loading projects" />;
}
