import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Variant = 'table' | 'cards' | 'list' | 'detail' | 'metrics' | 'chart';

interface LoadingSkeletonProps {
  variant?: Variant;
  rows?: number;
  className?: string;
  label?: string;
}

/**
 * Layout-shaped skeletons. Matching the final layout avoids content shift
 * when data streams in. Announced once to screen readers via aria-busy.
 */
export function LoadingSkeleton({ variant = 'list', rows = 5, className, label = 'Loading' }: LoadingSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={cn('animate-fade-in', className)}>
      {variant === 'table' && (
        <div className="overflow-hidden rounded-lg border">
          <div className="flex gap-4 border-b bg-muted/30 px-4 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 flex-[3]" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      )}
      {variant === 'cards' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      )}
      {variant === 'metrics' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      )}
      {variant === 'chart' && (
        <div className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-[220px] w-full" />
        </div>
      )}
      {variant === 'list' && (
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <Skeleton className="size-7 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}
      {variant === 'detail' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
