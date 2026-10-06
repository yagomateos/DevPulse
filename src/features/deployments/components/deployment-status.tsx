import { CheckCircle2, CircleDashed, Clock, Loader2, XCircle } from 'lucide-react';
import { DEPLOYMENT_STATUS } from '@/components/status/status-badges';
import { cn } from '@/lib/utils';
import type { DeploymentStatus as Status } from '@/types/domain';

const ICON = { success: CheckCircle2, failed: XCircle, in_progress: Loader2, queued: Clock, cancelled: CircleDashed } as const;
const TONE = { success: 'text-success bg-success/10 border-success/30', failed: 'text-destructive bg-destructive/10 border-destructive/30', in_progress: 'text-info bg-info/10 border-info/30', queued: 'text-muted-foreground bg-muted border-border', cancelled: 'text-muted-foreground bg-muted border-border' } as const;

/** Prominent status block for the deployment header. */
export function DeploymentStatus({ status, className }: { status: Status; className?: string }) {
  const Icon = ICON[status];
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-sm font-medium', TONE[status], className)} role="status">
      <Icon className={cn('size-4', status === 'in_progress' && 'animate-spin')} aria-hidden />
      {DEPLOYMENT_STATUS[status].label}
    </span>
  );
}
