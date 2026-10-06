import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ArchitectureDiagram } from '@/features/architecture/architecture-diagram';
import { DECISIONS, PORTFOLIO, STACK } from '@/features/architecture/content';

export const metadata: Metadata = { title: 'Architecture', description: 'How AI Engineering Workspace is built.' };

/** Fully static Server Component: zero client JavaScript for this page's content. */
export default function ArchitecturePage() {
  return (
    <article className="space-y-8">
      <PageHeader title="Architecture" description="How this workspace is built, and why." eyebrow="Technical documentation" />

      <section aria-labelledby="portfolio" className="rounded-lg border p-4">
        <h2 id="portfolio" className="text-sm font-semibold">
          Built to demonstrate Senior Frontend Engineering
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PORTFOLIO.map((p) => (
            <div key={p.title}>
              <dt className="text-[13px] font-medium">{p.title}</dt>
              <dd className="text-xs text-muted-foreground">{p.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="diagram" className="space-y-3">
        <h2 id="diagram" className="text-base font-semibold">
          System overview
        </h2>
        <ArchitectureDiagram />
      </section>

      <section aria-labelledby="stack" className="space-y-3">
        <h2 id="stack" className="text-base font-semibold">
          Stack
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((s) => (
            <Card key={s.area}>
              <CardHeader className="pb-2">
                <CardTitle>{s.area}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="decisions" className="space-y-3">
        <h2 id="decisions" className="text-base font-semibold">
          Technical decisions
        </h2>
        <div className="divide-y rounded-lg border">
          {DECISIONS.map((d) => (
            <details key={d.question} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden" open={d.question.startsWith('Why Server')}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                {d.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">{d.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="structure" className="space-y-3">
        <h2 id="structure" className="text-base font-semibold">
          Source layout
        </h2>
        <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed">{`src/
  app/            routes: (auth), (workspace) layouts, api/ route handlers
  components/     design system (ui/), data-table/, feedback/, layout/, status/
  features/       ai · auth · dashboard · projects · pull-requests · deployments
                  incidents · team · settings · search · notifications
  hooks/          useMediaQuery, useUrlState, useHotkeys, useDebouncedValue
  lib/            http client, query keys, permissions, formatting
  services/       typed API clients + TanStack queryOptions
  stores/         Zustand: ui, command palette, AI panel, dialogs, table prefs
  schemas/        Zod: forms, queries, AI structured outputs
  server/         auth, repositories (memory | postgres), AI, db (Drizzle)
  proxy.ts        optimistic route protection`}</pre>
      </section>
    </article>
  );
}
