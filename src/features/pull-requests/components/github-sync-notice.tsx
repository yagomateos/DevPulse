import { Unplug } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

/** Shown when the GitHub integration is disconnected in Settings → Integrations (webhooks and sync are paused). */
export function GithubSyncNotice() {
  return (
    <Alert>
      <Unplug className="size-4" />
      <AlertDescription className="text-[13px]">
        GitHub is disconnected — pull requests show the last synced snapshot.{' '}
        <Link href="/settings/integrations" className="text-primary hover:underline">
          Reconnect
        </Link>
      </AlertDescription>
    </Alert>
  );
}
