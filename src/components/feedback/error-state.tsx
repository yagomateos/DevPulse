import { AlertTriangle, Lock, SearchX, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/http';
import { cn } from '@/lib/utils';
import { RetryButton } from './retry-button';

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  description?: string;
  onRetry?: () => unknown;
  isRetrying?: boolean;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

function describe(error: unknown) {
  if (error instanceof ApiError) {
    if (error.isForbidden) return { icon: Lock, title: 'You don’t have access', description: error.message };
    if (error.isNotFound) return { icon: SearchX, title: 'Not found', description: error.message };
    if (error.status >= 500) return { icon: WifiOff, title: 'Service unavailable', description: error.message };
    return { icon: AlertTriangle, title: 'Request failed', description: error.message };
  }
  return { icon: AlertTriangle, title: 'Something went wrong', description: error instanceof Error ? error.message : 'An unexpected error occurred.' };
}

/** Uniform, accessible error surface. Maps ApiError status codes to copy. */
export function ErrorState({ error, title, description, onRetry, isRetrying, action, className, compact }: ErrorStateProps) {
  const info = describe(error);
  const Icon = info.icon;
  const retryable = !(error instanceof ApiError && (error.isForbidden || error.isNotFound));
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed text-center',
        compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-12',
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title ?? info.title}</p>
        <p className="mx-auto max-w-sm text-xs text-muted-foreground">{description ?? info.description}</p>
      </div>
      {(onRetry && retryable) || action ? (
        <div className="flex items-center gap-2">
          {onRetry && retryable && <RetryButton onRetry={onRetry} isRetrying={isRetrying} />}
          {action}
        </div>
      ) : null}
    </div>
  );
}
