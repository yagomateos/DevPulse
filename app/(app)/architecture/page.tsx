import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Layers,
  Database,
  Bot,
  TestTube,
  Shield,
  Zap,
  Server,
  Code2,
  GitBranch,
  Package,
} from 'lucide-react';

const stack = [
  {
    category: 'Frontend',
    icon: Code2,
    color: 'text-primary',
    items: [
      { name: 'React 18', desc: 'UI library with hooks, suspense, and concurrent features' },
      { name: 'Next.js 13', desc: 'App Router with Server & Client Components' },
      { name: 'TypeScript', desc: 'Strict mode, no implicit any, full type safety' },
      { name: 'Tailwind CSS', desc: 'Utility-first styling with custom design tokens' },
      { name: 'shadcn/ui', desc: 'Composable component library built on Radix UI' },
    ],
  },
  {
    category: 'State Management',
    icon: Layers,
    color: 'text-info',
    items: [
      { name: 'TanStack Query', desc: 'Server state: caching, dedup, background refetch' },
      { name: 'Zustand', desc: 'Client state: auth, UI, command palette' },
      { name: 'React Hook Form', desc: 'Form state with Zod schema validation' },
      { name: 'URL State', desc: 'Next.js searchParams for shareable filters' },
    ],
  },
  {
    category: 'AI',
    icon: Bot,
    color: 'text-success',
    items: [
      { name: 'Structured Outputs', desc: 'Typed AI analysis with findings & recommendations' },
      { name: 'Streaming', desc: 'Token-by-token streaming for AI assistant' },
      { name: 'Contextual AI', desc: 'Project-aware analysis for PRs, deployments, incidents' },
    ],
  },
  {
    category: 'Data Visualization',
    icon: Zap,
    color: 'text-warning',
    items: [
      { name: 'Recharts', desc: 'Interactive charts for deployment & performance metrics' },
      { name: 'TanStack Table', desc: 'Sort, filter, paginate, column visibility' },
    ],
  },
];

const decisions = [
  {
    question: 'Why Next.js App Router?',
    answer:
      'The App Router enables Server Components by default, reducing client-side JavaScript. Layouts, loading.tsx, error.tsx, and nested routing provide a first-class developer experience for building SaaS applications.',
  },
  {
    question: 'Why Server Components?',
    answer:
      'Server Components reduce bundle size by keeping non-interactive code on the server. They fetch data directly and pass it to Client Components as props, eliminating waterfalls.',
  },
  {
    question: 'Why TanStack Query?',
    answer:
      'TanStack Query handles server state concerns: caching, background refetching, deduplication, and optimistic updates. It separates server state from client state, preventing the anti-pattern of duplicating server data in global stores.',
  },
  {
    question: 'Why Zustand over Redux?',
    answer:
      'Zustand provides minimal, unopinionated global state for truly client-side concerns (auth, UI preferences, command palette). Redux adds ceremony that is unnecessary for this scope. Server state stays in TanStack Query.',
  },
  {
    question: 'Why React Hook Form + Zod?',
    answer:
      'React Hook Form provides controlled form state with minimal re-renders. Zod schemas give compile-time type safety and runtime validation from a single source of truth.',
  },
  {
    question: 'Why feature-based architecture?',
    answer:
      'Features are organized by domain (dashboard, projects, pull-requests, deployments, incidents, AI). Each feature has its own components, hooks, and types. This keeps related code together and makes the codebase navigable.',
  },
  {
    question: 'How does AI integrate with the frontend?',
    answer:
      'AI features use structured outputs (typed responses rendered as React components), streaming (token-by-token display), and contextual analysis (the AI receives project/PR/deployment context). The mock API simulates latency and streaming for the demo.',
  },
  {
    question: 'How are errors handled?',
    answer:
      'Reusable ErrorState, EmptyState, and LoadingSkeleton components are used across all pages. TanStack Query handles retries and refetching. Error boundaries catch unexpected errors at the route level.',
  },
];

export default function ArchitecturePage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Architecture</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Technical overview of the AI Engineering Workspace
        </p>
      </div>

      {/* Portfolio badge */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Built to demonstrate Senior Frontend Engineering</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              React · Next.js · TypeScript · Architecture · Testing · Accessibility · Performance · AI
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stack overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Technology Stack</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {stack.map((section) => (
            <Card key={section.category}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <section.icon className={`h-4 w-4 ${section.color}`} />
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{item.name}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Architecture diagram */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">System Diagram</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Layer: UI */}
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                  UI Layer (Client Components)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {['AppShell', 'Dashboard', 'Projects', 'Pull Requests', 'Deployments', 'Incidents', 'AI Assistant', 'Settings'].map((ui) => (
                    <div key={ui} className="rounded border bg-muted/50 px-2 py-1.5 text-center text-xs font-medium">
                      {ui}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <GitBranch className="h-4 w-4 text-muted-foreground rotate-90" />
              </div>

              {/* Layer: State */}
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                  State Layer
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded border bg-info/5 px-2 py-1.5 text-center text-xs">
                    <p className="font-medium">TanStack Query</p>
                    <p className="text-muted-foreground text-[10px]">Server State</p>
                  </div>
                  <div className="rounded border bg-success/5 px-2 py-1.5 text-center text-xs">
                    <p className="font-medium">Zustand</p>
                    <p className="text-muted-foreground text-[10px]">Client State</p>
                  </div>
                  <div className="rounded border bg-warning/5 px-2 py-1.5 text-center text-xs">
                    <p className="font-medium">React Hook Form</p>
                    <p className="text-muted-foreground text-[10px]">Form State</p>
                  </div>
                  <div className="rounded border bg-primary/5 px-2 py-1.5 text-center text-xs">
                    <p className="font-medium">URL Params</p>
                    <p className="text-muted-foreground text-[10px]">URL State</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <GitBranch className="h-4 w-4 text-muted-foreground rotate-90" />
              </div>

              {/* Layer: Data */}
              <div className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                  Data Layer
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded border bg-muted/50 px-2 py-1.5 text-center text-xs">
                    <p className="font-medium">Custom Hooks</p>
                    <p className="text-muted-foreground text-[10px]">useProjects, usePRs...</p>
                  </div>
                  <div className="rounded border bg-muted/50 px-2 py-1.5 text-center text-xs">
                    <p className="font-medium">Mock API</p>
                    <p className="text-muted-foreground text-[10px]">Simulated latency</p>
                  </div>
                  <div className="rounded border bg-muted/50 px-2 py-1.5 text-center text-xs">
                    <p className="font-medium">AI Engine</p>
                    <p className="text-muted-foreground text-[10px]">Streaming + structured</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Technical decisions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Technical Decisions</h2>
        <div className="space-y-3">
          {decisions.map((decision) => (
            <Card key={decision.question}>
              <CardHeader>
                <CardTitle className="text-sm">{decision.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{decision.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* React patterns */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">React Patterns Demonstrated</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            'Component composition & reusable components',
            'Custom hooks for data fetching (TanStack Query)',
            'Controlled forms with React Hook Form + Zod',
            'Optimistic UI updates',
            'Error handling with reusable ErrorState',
            'Loading & skeleton states',
            'Empty states for zero-data scenarios',
            'Reusable DataTable with sort/filter/paginate',
            'Command palette with keyboard navigation',
            'Responsive layouts (sidebar → drawer on mobile)',
            'Dark mode with system preference detection',
            'URL-based state for shareable filters',
          ].map((pattern) => (
            <div key={pattern} className="flex items-start gap-2 rounded-lg border p-3">
              <Package className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{pattern}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
