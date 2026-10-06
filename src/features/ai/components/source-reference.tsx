import { AlertTriangle, Boxes, GitPullRequest, Rocket } from 'lucide-react';
import Link from 'next/link';
import type { SourceRef } from '@/schemas/ai';

const ICONS = { project: Boxes, pull_request: GitPullRequest, deployment: Rocket, incident: AlertTriangle } as const;

/** Citation chip linking the answer back to the record it was derived from. */
export function SourceReference({ source, index }: { source: SourceRef; index: number }) {
  const Icon = ICONS[source.type];
  return (
    <Link
      href={source.href}
      className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      <span className="font-mono text-[10px] text-primary">[{index + 1}]</span>
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{source.label}</span>
    </Link>
  );
}
