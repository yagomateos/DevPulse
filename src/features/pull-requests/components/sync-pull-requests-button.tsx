'use client';

import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import { useSyncPullRequests } from '../hooks/use-pull-requests';

export function SyncPullRequestsButton({ projectId }: { projectId: string }) {
  const sync = useSyncPullRequests(projectId);
  return (
    <PermissionGate permission="project:update">
      <Button
        size="sm"
        variant="outline"
        disabled={sync.isPending}
        onClick={() =>
          sync.mutate(undefined, {
            onSuccess: (r) =>
              r.synced + r.skipped === 0
                ? toast.info('No pull requests on GitHub yet', { description: 'Open a PR against this repository and it will appear here.' })
                : toast.success(`Synced ${r.synced} pull request${r.synced === 1 ? '' : 's'} from GitHub`, { description: r.failed ? `${r.failed} failed: ${r.error}` : undefined }),
            onError: (error) => toast.error('GitHub sync failed', { description: error.message }),
          })
        }
      >
        <RefreshCw className={sync.isPending ? 'animate-spin' : undefined} />
        {sync.isPending ? 'Syncing…' : 'Sync from GitHub'}
      </Button>
    </PermissionGate>
  );
}
