import { cn } from '@/lib/utils';

interface Node {
  title: string;
  items: string[];
  tone: string;
}

const LAYERS: { label: string; nodes: Node[] }[] = [
  {
    label: 'Browser',
    nodes: [
      { title: 'Client Components', items: ['Interaction, forms, charts', 'useQuery / useMutation', 'Zustand UI state'], tone: 'border-info/40 bg-info/5' },
      { title: 'URL state', items: ['Filters, sorting, tabs', 'history.replaceState', 'Shareable views'], tone: 'border-info/40 bg-info/5' },
      { title: 'TanStack Query cache', items: ['Hydrated from the server', 'Optimistic updates', 'Retries & invalidation'], tone: 'border-info/40 bg-info/5' },
    ],
  },
  {
    label: 'Next.js server',
    nodes: [
      { title: 'proxy.ts', items: ['Optimistic auth check', 'Signed cookie (HMAC)', 'Redirect / 401'], tone: 'border-primary/40 bg-primary/5' },
      { title: 'Server Components', items: ['Layouts, pages, metadata', 'Suspense streaming', 'Prefetch → <Hydrate>'], tone: 'border-primary/40 bg-primary/5' },
      { title: 'Route Handlers & Actions', items: ['Zod-validated input', 'RBAC enforcement', 'NDJSON AI stream'], tone: 'border-primary/40 bg-primary/5' },
    ],
  },
  {
    label: 'Domain & data',
    nodes: [
      { title: 'Repository interface', items: ['Single data seam', 'Memory (demo) / Postgres', 'Selected by DATA_SOURCE'], tone: 'border-success/40 bg-success/5' },
      { title: 'PostgreSQL · Drizzle', items: ['Typed schema & queries', 'JSONB aggregates', 'Seed from demo dataset'], tone: 'border-success/40 bg-success/5' },
      { title: 'AI module', items: ['OpenAI-compatible client', 'Structured outputs + tools', 'Deterministic demo model'], tone: 'border-warning/40 bg-warning/5' },
    ],
  },
];

/** Layered architecture diagram built with HTML/CSS so it follows the theme and stays accessible. */
export function ArchitectureDiagram() {
  return (
    <figure className="space-y-2">
      <div className="space-y-2">
        {LAYERS.map((layer, i) => (
          <div key={layer.label}>
            <div className="grid gap-2 rounded-xl border border-dashed p-3 md:grid-cols-[120px_1fr]">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:pt-2">{layer.label}</p>
              <ul className="grid gap-2 sm:grid-cols-3">
                {layer.nodes.map((n) => (
                  <li key={n.title} className={cn('rounded-lg border p-3', n.tone)}>
                    <p className="text-[13px] font-semibold">{n.title}</p>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                      {n.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            {i < LAYERS.length - 1 && (
              <div className="flex justify-center py-1 text-muted-foreground" aria-hidden>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 0v18M2 12l6 6 6-6" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <figcaption className="text-xs text-muted-foreground">Requests flow top to bottom; data returns as server-rendered HTML plus a dehydrated query cache, then the client takes over.</figcaption>
    </figure>
  );
}
