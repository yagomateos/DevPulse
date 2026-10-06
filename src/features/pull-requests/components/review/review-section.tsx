'use client';

import { Accessibility, ChevronDown, Gauge, ShieldAlert, TestTube2, Wrench, Braces, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { FindingCategory, PRFinding } from '@/schemas/ai';
import { ReviewFinding } from './review-finding';

export const CATEGORY_META: Record<FindingCategory, { icon: LucideIcon; tone: string }> = {
  Security: { icon: ShieldAlert, tone: 'text-destructive' },
  Performance: { icon: Gauge, tone: 'text-warning' },
  Accessibility: { icon: Accessibility, tone: 'text-info' },
  'Type Safety': { icon: Braces, tone: 'text-primary' },
  Testing: { icon: TestTube2, tone: 'text-success' },
  Maintainability: { icon: Wrench, tone: 'text-muted-foreground' },
};

/** Collapsible group of findings for one category. */
export function ReviewSection({ category, findings, onLocate, defaultOpen = true }: { category: FindingCategory; findings: PRFinding[]; onLocate?: (file: string, line: number | null) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { icon: Icon, tone } = CATEGORY_META[category];
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <section aria-label={`${category} findings`}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-[13px] font-medium hover:bg-accent/50">
          <Icon className={cn('size-4', tone)} aria-hidden />
          {category}
          <span className="rounded bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{findings.length}</span>
          <ChevronDown className={cn('ml-auto size-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-1 data-[state=closed]:animate-out data-[state=open]:animate-in">
          {findings.map((f) => (
            <ReviewFinding key={f.id} finding={f} onLocate={onLocate} />
          ))}
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
