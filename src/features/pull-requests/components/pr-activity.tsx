import { CheckCircle2, GitCommit, MessageSquare, XCircle } from 'lucide-react';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CheckStatusIcon } from '@/components/status/status-badges';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CheckRun, Commit, ReviewComment } from '@/types/domain';

export function ChecksList({ checks }: { checks: CheckRun[] }) {
  const failed = checks.filter((c) => c.status === 'failed').length;
  return (
    <div className="overflow-hidden rounded-lg border">
      <p className={cn('flex items-center gap-2 border-b px-3 py-2 text-xs font-medium', failed ? 'text-destructive' : 'text-success')}>
        {failed ? <XCircle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
        {failed ? `${failed} of ${checks.length} checks failed` : 'All checks passed'}
      </p>
      <ul className="divide-y">
        {checks.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-3 py-2">
            <CheckStatusIcon status={c.status} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px]">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{c.summary}</span>
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">{formatDuration(c.durationSeconds)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CommitList({ commits }: { commits: Commit[] }) {
  return (
    <ol className="space-y-1">
      {commits.map((c) => (
        <li key={c.sha} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/40">
          <GitCommit className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px]">{c.message}</span>
            <span className="text-[11px] text-muted-foreground">
              {c.author} · <RelativeTime value={c.committedAt} />
            </span>
          </span>
          <span className="font-mono text-[11px]">
            <span className="text-success">+{c.additions}</span> <span className="text-destructive">−{c.deletions}</span>
          </span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{c.sha}</code>
        </li>
      ))}
    </ol>
  );
}

const KIND_LABEL: Record<ReviewComment['kind'], { label: string; tone: string }> = {
  comment: { label: 'commented', tone: 'text-muted-foreground' },
  approval: { label: 'approved', tone: 'text-success' },
  changes_requested: { label: 'requested changes', tone: 'text-destructive' },
};

export function CommentThread({ comments }: { comments: ReviewComment[] }) {
  if (comments.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No review comments yet.</p>;
  return (
    <ol className="space-y-3">
      {comments.map((c) => (
        <li key={c.id} className="flex gap-3">
          <UserAvatar name={c.author} size="md" />
          <div className="min-w-0 flex-1 rounded-lg border">
            <p className="flex flex-wrap items-center gap-1.5 border-b bg-muted/30 px-3 py-1.5 text-xs">
              <span className="font-medium">{c.author}</span>
              <span className={KIND_LABEL[c.kind].tone}>{KIND_LABEL[c.kind].label}</span>
              <RelativeTime value={c.createdAt} className="text-muted-foreground" />
              {c.path && (
                <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <MessageSquare className="size-3" aria-hidden />
                  {c.path}:{c.line}
                </span>
              )}
            </p>
            <p className="px-3 py-2 text-[13px]">{c.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
