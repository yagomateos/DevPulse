import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Recommendation } from '@/features/pull-requests/components/review/recommendation';
import type { IncidentAnalysis } from '@/schemas/ai';

export function IncidentAnalysisResult({ result }: { result: IncidentAnalysis }) {
  const confidence = Math.round(result.confidence * 100);
  return (
    <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4 border-b p-4 lg:border-b-0 lg:border-r">
        <section>
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Summary</h3>
          <p className="text-sm leading-relaxed">{result.summary}</p>
        </section>
        <section className="rounded-md border border-warning/30 bg-warning/5 p-3">
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wider text-warning">Likely cause</h3>
          <p className="text-sm leading-relaxed">{result.likelyCause}</p>
        </section>
        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Evidence</h3>
          <ol className="space-y-2">
            {result.evidence.map((e, i) => (
              <li key={e.id} className="flex gap-2.5 text-xs">
                <span className="mt-0.5 font-mono text-primary">[{i + 1}]</span>
                <div className="min-w-0">
                  <p className="font-medium">{e.href ? <Link href={e.href} className="hover:underline">{e.label}</Link> : e.label}</p>
                  <p className="text-muted-foreground">{e.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="space-y-5 p-4">
        <section>
          <h3 className="mb-2 flex justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Confidence <span className="font-mono normal-case">{confidence}%</span>
          </h3>
          <Progress value={confidence} aria-label={`Confidence ${confidence}%`} className="h-1.5" />
        </section>
        <section>
          <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Affected services</h3>
          <ul className="flex flex-wrap gap-1.5">
            {result.affectedServices.map((s) => (
              <li key={s} className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px]">
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Recommendations</h3>
          <ol className="space-y-3">
            {result.recommendations.map((r, i) => (
              <Recommendation key={r.id} recommendation={r} index={i} />
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
