export const STACK = [
  { area: 'Frontend', items: ['React 19', 'Next.js 16 (App Router, Turbopack)', 'TypeScript (strict, noUncheckedIndexedAccess)'] },
  { area: 'State', items: ['TanStack Query — server state', 'Zustand — client UI state', 'URL search params — view state', 'React Hook Form + Zod — form state'] },
  { area: 'UI', items: ['Tailwind CSS with design tokens', 'shadcn/ui on Radix primitives', 'cmdk, vaul, Recharts, Lucide'] },
  { area: 'AI', items: ['OpenAI-compatible Chat Completions', 'Streaming (NDJSON events)', 'Structured outputs (JSON Schema from Zod)', 'Tool calling over the repository'] },
  { area: 'Testing', items: ['Vitest', 'React Testing Library + user-event', 'Playwright end-to-end'] },
  { area: 'Platform', items: ['Route Handlers + Server Actions', 'PostgreSQL + Drizzle ORM', 'Docker, GitHub Actions'] },
];

export const DECISIONS: { question: string; answer: string }[] = [
  {
    question: 'Why Next.js?',
    answer: 'One framework for routing, rendering and the thin backend-for-frontend. Nested layouts keep the project header and tabs mounted across tab changes, loading/error/not-found files give every segment a consistent fallback, and Route Handlers host the mock API without a second service.',
  },
  {
    question: 'Why Server Components?',
    answer: 'Pages, layouts and metadata run on the server: they read the session, call the repository directly (no HTTP hop), and stream sections behind Suspense. Their output is HTML plus a dehydrated TanStack cache, so the browser receives data without waterfalls and ships no code for static parts like this page.',
  },
  {
    question: 'Why Client Components?',
    answer: 'Only where interaction lives: tables, filters, forms, charts, the command palette and the AI chat. They are leaves composed by server parents (the AppShell itself is a Server Component wrapping small client islands), which keeps the client bundle proportional to interactivity.',
  },
  {
    question: 'Why TanStack Query?',
    answer: 'Server state has different needs than UI state: caching, deduplication, background refetch, retries, pagination with keepPreviousData, and optimistic mutations with rollback. Query keys are hierarchical (queryKeys.incidents.all) so a mutation can invalidate exactly what it affected. Server-prefetched data is injected with the same keys.',
  },
  {
    question: 'Why Zustand?',
    answer: 'For the small amount of truly global client state: sidebar collapse, command palette, the AI panel context stack, global dialogs and table column preferences. Stores are tiny, selector-based (no unnecessary re-renders) and persisted only where it is a user preference — never used as a cache for server data.',
  },
  {
    question: 'Why React Hook Form + Zod?',
    answer: 'Uncontrolled inputs keep typing fast; Zod schemas are shared with the server, so the exact same rules validate on the client, in Route Handlers and for AI outputs. Server-side 422 issues are mapped back onto fields (applyServerErrors) so both layers surface errors identically.',
  },
  {
    question: 'Why a feature-based architecture?',
    answer: 'src/features/<domain> owns its components, hooks and logic; src/components holds the design system and cross-cutting primitives (DataTable, feedback states); src/services and src/server define the data boundary. Features depend on shared layers, not on each other’s internals, which keeps pages thin (most are under 40 lines).',
  },
  {
    question: 'How does AI integrate with the frontend?',
    answer: 'Analyses are structured: the server requests JSON-Schema-constrained output, validates it with Zod and stores it; React components render risk gauges, grouped findings, evidence and recommendations — and findings with file/line appear inline in the diff. The assistant streams NDJSON events (status, sources, text, done) consumed by a useChat hook with abort and retry. Pages register their context into a stack, so the global “Ask AI” panel always knows what the user is looking at.',
  },
  {
    question: 'How are errors handled?',
    answer: 'A typed ApiError carries status and field issues. Queries never retry 4xx errors; 401 triggers a global session-expired flow that returns the user to where they were. Every data surface goes through QueryState / ErrorState / EmptyState / LoadingSkeleton, route segments have error.tsx boundaries, and Settings → General can inject latency and failures into the mock API to demonstrate it all.',
  },
  {
    question: 'How is performance managed?',
    answer: 'Server rendering + streaming for first paint; dynamic imports for Recharts, the markdown renderer and dialog forms; optimizePackageImports for icons; memoised table columns and chat messages (only the streaming message re-renders per token); useDeferredValue for log filtering; debounced, abortable search; URL updates via the History API to avoid server round trips; and query caching with sensible stale times.',
  },
];

export const PORTFOLIO = [
  { title: 'React', detail: 'Composition over configuration, custom hooks, render props (AnalysisPanel), memoisation where it pays off.' },
  { title: 'Next.js', detail: 'App Router, nested layouts, Server Components, Suspense streaming, Route Handlers, Server Actions, proxy, metadata.' },
  { title: 'TypeScript', detail: 'Strict mode, schema-inferred types end to end, discriminated unions for stream events.' },
  { title: 'Frontend architecture', detail: 'Feature folders, a single data seam, query-key hierarchy, clear state ownership.' },
  { title: 'Testing', detail: 'Behavioural unit/component tests and Playwright journeys for the main flows.' },
  { title: 'Accessibility', detail: 'Semantic landmarks, keyboard-first tables and palette, aria-sort/live regions, focus management via Radix.' },
  { title: 'Performance', detail: 'Streaming, code splitting, caching and render isolation.' },
  { title: 'AI', detail: 'Structured outputs, tool calling, streaming UX, grounded citations.' },
];
