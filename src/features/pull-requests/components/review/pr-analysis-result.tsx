'use client';

import { FINDING_CATEGORIES, type PRAnalysis } from '@/schemas/ai';
import { Recommendation } from './recommendation';
import { ReviewSection, CATEGORY_META } from './review-section';
import { RiskScore } from './risk-score';
import { cn } from '@/lib/utils';

/** Structured rendering of the AI review: never just a wall of text. */
export function PRAnalysisResult({ result, onLocate }: { result: PRAnalysis; onLocate?: (file: string, line: number | null) => void }) {
  // Most severe category first, so the top finding is always visible without scrolling.
  const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const grouped = FINDING_CATEGORIES.map((category) => ({ category, findings: result.findings.filter((f) => f.category === category) }))
    .filter((g) => g.findings.length > 0)
    .sort((a, b) => Math.min(...a.findings.map((f) => rank[f.severity])) - Math.min(...b.findings.map((f) => rank[f.severity])));
  return (
    <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
      <div className="flex flex-col items-center gap-4 border-b p-4 lg:border-b-0 lg:border-r">
        <RiskScore score={result.riskScore} level={result.riskLevel} caption={`${result.findings.length} findings`} />
        <ul className="grid w-full grid-cols-2 gap-1.5 text-[11px]" aria-label="Findings by category">
          {FINDING_CATEGORIES.map((c) => {
            const count = result.findings.filter((f) => f.category === c).length;
            const { icon: Icon, tone } = CATEGORY_META[c];
            return (
              <li key={c} className={cn('flex items-center gap-1.5 rounded border px-1.5 py-1', count === 0 && 'border-dashed text-muted-foreground')}>
                <Icon className={cn('size-3', tone)} aria-hidden />
                <span className="truncate">{c}</span>
                <span className="ml-auto font-mono">{count}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="space-y-5 p-4">
        <section aria-label="Summary">
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Summary</h3>
          <p className="text-sm leading-relaxed">{result.summary}</p>
        </section>
        <section aria-label="Findings" className="space-y-1">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Findings</h3>
          {grouped.map((g, i) => (
            <ReviewSection key={g.category} category={g.category} findings={g.findings} onLocate={onLocate} defaultOpen={i < 2} />
          ))}
        </section>
        {result.recommendations.length > 0 && (
          <section aria-label="Recommendations">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Recommendations</h3>
            <ol className="space-y-3">
              {result.recommendations.map((r, i) => (
                <Recommendation key={r.id} recommendation={r} index={i} />
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
