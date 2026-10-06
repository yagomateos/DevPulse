'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { EnvironmentBadge } from '@/components/status/status-badges';
import type { DeploymentSummary } from '@/types/domain';
import { useDeployment } from '../hooks/use-deployments';
import { CommitInfo } from './commit-info';
import { DeploymentStatus } from './deployment-status';
import { DeploymentTimeline } from './deployment-timeline';

/** Quick look without leaving the list; state lives in the URL (?preview=). */
export function DeploymentPreviewDrawer({ deployment, onClose, onOpen }: { deployment: DeploymentSummary | null; onClose: () => void; onOpen: (d: DeploymentSummary) => void }) {
  const detail = useDeployment(deployment?.projectId ?? '', deployment?.number ?? 0);
  return (
    <Sheet open={!!deployment} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-5 overflow-y-auto sm:max-w-lg">
        {deployment && (
          <>
            <SheetHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <DeploymentStatus status={deployment.status} />
                <EnvironmentBadge environment={deployment.environment} />
              </div>
              <SheetTitle>Deployment #{deployment.number}</SheetTitle>
              <SheetDescription>{deployment.projectId}</SheetDescription>
            </SheetHeader>
            <CommitInfo deployment={deployment} />
            <section className="space-y-2">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pipeline</h3>
              {detail.data ? <DeploymentTimeline stages={detail.data.stages} /> : <LoadingSkeleton variant="list" rows={3} />}
            </section>
            <SheetFooter className="mt-auto">
              <Button onClick={() => onOpen(deployment)} className="w-full sm:w-auto">
                Open full details <ArrowRight />
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
