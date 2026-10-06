import { FileCode2, Lightbulb } from 'lucide-react';
import { RiskBadge } from '@/components/status/status-badges';
import type { PRFinding } from '@/schemas/ai';

interface ReviewFindingProps {
  finding: PRFinding;
  /** Jump to the referenced file/line in the diff. */
  onLocate?: (file: string, line: number | null) => void;
  compact?: boolean;
}

export function ReviewFinding({ finding, onLocate, compact = false }: ReviewFindingProps) {
  return (
    <article className="space-y-2 rounded-md border bg-background/50 p-3" aria-labelledby={`finding-${finding.id}`}>
      <header className="flex items-start justify-between gap-3">
        <h4 id={`finding-${finding.id}`} className="text-[13px] font-medium leading-snug">
          {finding.title}
        </h4>
        <RiskBadge level={finding.severity} />
      </header>
      <p className="text-xs leading-relaxed text-muted-foreground">{finding.description}</p>
      {finding.file &&
        (onLocate ? (
          <button type="button" onClick={() => onLocate(finding.file!, finding.line)} className="inline-flex max-w-full items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground">
            <FileCode2 className="size-3 shrink-0" aria-hidden />
            <span className="truncate">
              {finding.file}
              {finding.line ? `:${finding.line}` : ''}
            </span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <FileCode2 className="size-3" aria-hidden /> {finding.file}
            {finding.line ? `:${finding.line}` : ''}
          </span>
        ))}
      {finding.suggestion && !compact && (
        <p className="flex gap-2 rounded bg-primary/5 px-2 py-1.5 text-xs">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          <span>{finding.suggestion}</span>
        </p>
      )}
    </article>
  );
}
