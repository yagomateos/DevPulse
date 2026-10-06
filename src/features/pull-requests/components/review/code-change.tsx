'use client';

import { ChevronDown, MessageSquare, Sparkles } from 'lucide-react';
import { Fragment, memo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RiskBadge } from '@/components/status/status-badges';
import { cn } from '@/lib/utils';
import type { PRFinding } from '@/schemas/ai';
import type { FileChange, ReviewComment } from '@/types/domain';

const STATUS_TONE: Record<FileChange['status'], string> = { added: 'text-success', modified: 'text-warning', deleted: 'text-destructive', renamed: 'text-info' };

export const fileAnchor = (path: string) => `file-${path.replace(/[^a-z0-9]+/gi, '-')}`;

interface CodeChangeProps {
  file: FileChange;
  findings?: PRFinding[];
  comments?: ReviewComment[];
  /** Line (new numbering) to emphasise, e.g. when jumping from a finding. */
  focusLine?: number | null;
}

/**
 * Unified diff for one file with line numbers, add/remove colouring, a
 * collapsible body, a "viewed" toggle, and AI findings / review comments
 * rendered inline under the line they refer to.
 */
export const CodeChange = memo(function CodeChange({ file, findings = [], comments = [], focusLine }: CodeChangeProps) {
  const [open, setOpen] = useState(true);
  const [viewed, setViewed] = useState(false);
  const notesByLine = new Map<number, { findings: PRFinding[]; comments: ReviewComment[] }>();
  for (const f of findings) if (f.line) notesByLine.set(f.line, { findings: [...(notesByLine.get(f.line)?.findings ?? []), f], comments: notesByLine.get(f.line)?.comments ?? [] });
  for (const c of comments) if (c.line) notesByLine.set(c.line, { findings: notesByLine.get(c.line)?.findings ?? [], comments: [...(notesByLine.get(c.line)?.comments ?? []), c] });
  const fileLevelFindings = findings.filter((f) => !f.line);
  const total = file.additions + file.deletions || 1;
  const bodyId = `${fileAnchor(file.path)}-body`;

  return (
    <section id={fileAnchor(file.path)} className="scroll-mt-20 overflow-hidden rounded-lg border" aria-label={`Changes in ${file.path}`}>
      <header className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={bodyId} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} aria-hidden />
          <span className={cn('font-mono text-[10px] font-semibold uppercase', STATUS_TONE[file.status])}>{file.status[0]}</span>
          <span className="truncate font-mono text-xs">{file.path}</span>
        </button>
        {findings.length > 0 && (
          <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
            <Sparkles className="size-3" aria-hidden /> {findings.length}
          </span>
        )}
        <span className="hidden items-center gap-1 font-mono text-[11px] sm:flex">
          <span className="text-success">+{file.additions}</span>
          <span className="text-destructive">−{file.deletions}</span>
          <span className="ml-1 flex h-1.5 w-12 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span className="bg-success" style={{ width: `${(file.additions / total) * 100}%` }} />
            <span className="bg-destructive" style={{ width: `${(file.deletions / total) * 100}%` }} />
          </span>
        </span>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Checkbox
            checked={viewed}
            onCheckedChange={(v) => {
              setViewed(!!v);
              if (v) setOpen(false);
            }}
          />
          Viewed
        </label>
      </header>
      {open && (
        <div id={bodyId} className="overflow-x-auto scrollbar-thin">
          {fileLevelFindings.map((f) => (
            <InlineFinding key={f.id} finding={f} />
          ))}
          {file.hunks.map((hunk) => (
            <table key={hunk.header} className="w-full border-collapse font-mono text-[12px] leading-5">
              <caption className="sr-only">{hunk.header}</caption>
              <tbody>
                <tr className="bg-info/5 text-info">
                  <td colSpan={3} className="px-3 py-1 text-[11px]">
                    {hunk.header}
                  </td>
                </tr>
                {hunk.lines.map((line, i) => {
                  const notes = line.newNumber ? notesByLine.get(line.newNumber) : undefined;
                  const focused = focusLine != null && line.newNumber === focusLine;
                  return (
                    <Fragment key={i}>
                      <tr
                        className={cn(
                          line.kind === 'add' && 'bg-success/10',
                          line.kind === 'remove' && 'bg-destructive/10',
                          (notes || focused) && 'outline outline-1 -outline-offset-1 outline-primary/40',
                          focused && 'bg-primary/10',
                        )}
                      >
                        <td className="w-10 select-none border-r px-2 text-right text-muted-foreground/70">{line.oldNumber ?? ''}</td>
                        <td className="w-10 select-none border-r px-2 text-right text-muted-foreground/70">{line.newNumber ?? ''}</td>
                        <td className="whitespace-pre px-3">
                          <span className={cn('mr-2 select-none', line.kind === 'add' ? 'text-success' : line.kind === 'remove' ? 'text-destructive' : 'text-transparent')} aria-label={line.kind === 'add' ? 'Added' : line.kind === 'remove' ? 'Removed' : undefined}>
                            {line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '}
                          </span>
                          {line.content}
                        </td>
                      </tr>
                      {notes && (
                        <tr>
                          <td colSpan={3} className="border-y bg-background p-0 font-sans">
                            {notes.findings.map((f) => (
                              <InlineFinding key={f.id} finding={f} />
                            ))}
                            {notes.comments.map((c) => (
                              <div key={c.id} className="flex gap-2 px-3 py-2 text-xs">
                                <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                                <p>
                                  <span className="font-medium">{c.author}</span> <span className="text-muted-foreground">{c.body}</span>
                                </p>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          ))}
        </div>
      )}
    </section>
  );
});

function InlineFinding({ finding }: { finding: PRFinding }) {
  return (
    <div className="flex gap-2 border-l-2 border-primary bg-primary/5 px-3 py-2 font-sans text-xs">
      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {finding.title} <RiskBadge level={finding.severity} />
          <span className="text-[11px] font-normal text-muted-foreground">{finding.category}</span>
        </p>
        {finding.suggestion && <p className="text-muted-foreground">{finding.suggestion}</p>}
      </div>
    </div>
  );
}
