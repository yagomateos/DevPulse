import { GitBranch, GitCommit, GitPullRequest } from 'lucide-react';
import Link from 'next/link';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import type { DeploymentSummary } from '@/types/domain';

export function CommitInfo({ deployment }: { deployment: DeploymentSummary }) {
  const prNumber = deployment.pullRequestId?.split('#')[1];
  return (
    <dl className="grid gap-3 text-xs sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="sr-only">Commit message</dt>
        <dd className="text-sm font-medium">{deployment.commitMessage}</dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="flex items-center gap-1 text-muted-foreground">
          <GitCommit className="size-3.5" aria-hidden /> Commit
        </dt>
        <dd>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{deployment.commitSha}</code>
        </dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="flex items-center gap-1 text-muted-foreground">
          <GitBranch className="size-3.5" aria-hidden /> Branch
        </dt>
        <dd className="font-mono">{deployment.branch}</dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="text-muted-foreground">Author</dt>
        <dd className="flex items-center gap-1.5">
          <UserAvatar name={deployment.author} size="xs" /> {deployment.author}
        </dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="text-muted-foreground">Started</dt>
        <dd>
          <RelativeTime value={deployment.startedAt} />
        </dd>
      </div>
      {prNumber && (
        <div className="flex items-center gap-2 sm:col-span-2">
          <dt className="flex items-center gap-1 text-muted-foreground">
            <GitPullRequest className="size-3.5" aria-hidden /> Source
          </dt>
          <dd>
            <Link href={`/projects/${deployment.projectId}/pull-requests/${prNumber}`} className="text-primary hover:underline">
              Pull request #{prNumber}
            </Link>
          </dd>
        </div>
      )}
    </dl>
  );
}
