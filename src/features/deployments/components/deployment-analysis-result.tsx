import { Activity, FileDiff, FlaskConical, ScrollText } from 'lucide-react';
import { RiskBadge } from '@/components/status/status-badges';
import { Recommendation } from '@/features/pull-requests/components/review/recommendation';
import type { DeploymentAnalysis } from '@/schemas/ai';

const SOURCE_ICON = { logs: ScrollText, metrics: Activity, tests: FlaskConical, changes: FileDiff } as const;

export function DeploymentAnalysisResult({ result }: { result: DeploymentAnalysis }) {
  return (
    <div className="grid gap-0 lg:grid-cols-2">
      <div className="space-y-4 border-b p-4 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Risk</span>
          <RiskBadge level={result.risk} />
          <span className="ml-auto text-xs text-muted-foreground">Confidence {(result.confidence * 100).toFixed(0)}%</span>
        </div>
        <section>
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Possible cause</h3>
          <p className="text-sm leading-relaxed">{result.possibleCause}</p>
        </section>
        {result.affectedAreas.length > 0 && (
          <section>
            <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Affected areas</h3>
            <ul className="flex flex-wrap gap-1.5">
              {result.affectedAreas.map((a) => (
                <li key={a} className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px]">
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Recommended actions</h3>
          <ol className="space-y-3">
            {result.recommendedActions.map((r, i) => (
              <Recommendation key={r.id} recommendation={r} index={i} />
            ))}
          </ol>
        </section>
      </div>
      <section className="p-4">
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Evidence</h3>
        <ol className="space-y-2">
          {result.evidence.map((e) => {
            const Icon = SOURCE_ICON[e.source];
            return (
              <li key={e.id} className="flex gap-2.5 rounded-md border p-2.5">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-label={e.source} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{e.label}</p>
                  <p className="break-words font-mono text-[11px] text-muted-foreground">{e.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
