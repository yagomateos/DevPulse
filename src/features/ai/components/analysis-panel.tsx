'use client';

import { Check, Loader2, RotateCw, Sparkles } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { RelativeTime } from '@/components/shared/relative-time';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { cn } from '@/lib/utils';
import type { AIAnalysisEnvelope, AIAnalysisKind } from '@/schemas/ai';

interface AnalysisPanelProps<K extends AIAnalysisKind> {
  title: string;
  description: string;
  ctaLabel: string;
  /** Progress copy shown while the model works. */
  steps: string[];
  analysis: AIAnalysisEnvelope<K> | null;
  isLoadingPrevious: boolean;
  isAnalyzing: boolean;
  error: unknown;
  onAnalyze: () => void;
  children: (result: AIAnalysisEnvelope<K>['result']) => ReactNode;
}

function ProgressSteps({ steps }: { steps: string[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((i) => Math.min(i + 1, steps.length - 1)), 700);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <div role="status" aria-live="polite" className="space-y-4 p-4">
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={step} className={cn('flex items-center gap-2 text-xs transition-opacity', i > active && 'text-muted-foreground')}>
            {i < active ? <Check className="size-3.5 text-success" aria-hidden /> : i === active ? <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden /> : <span className="size-3.5 rounded-full border" aria-hidden />}
            {step}
          </li>
        ))}
      </ol>
      <div className="space-y-2" aria-hidden>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

/**
 * Shared lifecycle for every structured AI analysis (PR, deployment,
 * incident): idle CTA → progressive loading → error with retry → result.
 * The result renderer is a render prop, so each domain owns its visuals.
 */
export function AnalysisPanel<K extends AIAnalysisKind>({ title, description, ctaLabel, steps, analysis, isLoadingPrevious, isAnalyzing, error, onAnalyze, children }: AnalysisPanelProps<K>) {
  const { can } = usePermissions();
  const allowed = can('ai:analyze');

  return (
    <Card className="overflow-hidden" aria-busy={isAnalyzing}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r from-primary/[0.06] to-transparent px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-medium">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {analysis ? (
                <>
                  Generated <RelativeTime value={analysis.createdAt} /> · <span className="font-mono">{analysis.model}</span>
                </>
              ) : (
                description
              )}
            </p>
          </div>
        </div>
        {allowed ? (
          <Button size="sm" variant={analysis ? 'outline' : 'default'} onClick={onAnalyze} loading={isAnalyzing}>
            {!isAnalyzing && (analysis ? <RotateCw /> : <Sparkles />)}
            {isAnalyzing ? 'Analyzing…' : analysis ? 'Re-run analysis' : ctaLabel}
          </Button>
        ) : (
          <Badge variant="outline">Your role can’t run AI analysis</Badge>
        )}
      </div>
      {isAnalyzing ? (
        <ProgressSteps steps={steps} />
      ) : error ? (
        <div className="p-4">
          <ErrorState error={error} title="Analysis failed" onRetry={onAnalyze} compact />
        </div>
      ) : analysis ? (
        <div className="animate-slide-up">{children(analysis.result)}</div>
      ) : isLoadingPrevious ? (
        <div className="p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}
    </Card>
  );
}
