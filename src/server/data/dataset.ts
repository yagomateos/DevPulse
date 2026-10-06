import type {
  CheckRun,
  Commit,
  Deployment,
  DeploymentStage,
  DeploymentStatus,
  DiffHunk,
  DiffLine,
  Environment,
  FileChange,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  LogEntry,
  Notification,
  PerformancePoint,
  PerformanceSnapshot,
  Project,
  PullRequest,
  PullRequestStatus,
  ReviewStatus,
  RiskLevel,
  TeamMember,
  TimelineEvent,
} from '@/types/domain';
import { createRandom, type Random } from './random';

/**
 * Builds the complete demo dataset. Everything is derived from a seeded PRNG
 * and a reference "now", so the same input always yields the same data
 * (stable UI, deterministic tests) while timestamps stay fresh.
 *
 * The story the data tells (used by the demo flow):
 *   Orion API Gateway PR #312 → production deployment #128 fails during a DB
 *   migration → incident INC-42 (auth timeouts) is opened.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface Dataset {
  members: TeamMember[];
  projects: Project[];
  pullRequests: PullRequest[];
  deployments: Deployment[];
  incidents: Incident[];
  notifications: Notification[];
}

export const DEMO_USER_ID = 'usr_alex';

const MEMBERS: Omit<TeamMember, 'lastActiveAt'>[] = [
  { id: DEMO_USER_ID, name: 'Alex Chen', email: 'demo@example.com', role: 'ADMIN', title: 'Staff Engineer', status: 'active', presence: 'online' },
  { id: 'usr_sarah', name: 'Sarah Kim', email: 'sarah.kim@acme.dev', role: 'MANAGER', title: 'Engineering Manager', status: 'active', presence: 'online' },
  { id: 'usr_marcus', name: 'Marcus Rivera', email: 'marcus.rivera@acme.dev', role: 'DEVELOPER', title: 'Senior Backend Engineer', status: 'active', presence: 'away' },
  { id: 'usr_priya', name: 'Priya Patel', email: 'priya.patel@acme.dev', role: 'DEVELOPER', title: 'Frontend Engineer', status: 'active', presence: 'online' },
  { id: 'usr_jordan', name: 'Jordan Lee', email: 'jordan.lee@acme.dev', role: 'DEVELOPER', title: 'Frontend Engineer', status: 'active', presence: 'offline' },
  { id: 'usr_emma', name: 'Emma Wilson', email: 'emma.wilson@acme.dev', role: 'MANAGER', title: 'Design Systems Lead', status: 'active', presence: 'offline' },
  { id: 'usr_noah', name: 'Noah Garcia', email: 'noah.garcia@acme.dev', role: 'DEVELOPER', title: 'SRE', status: 'active', presence: 'online' },
  { id: 'usr_lena', name: 'Lena Novak', email: 'lena.novak@acme.dev', role: 'DEVELOPER', title: 'Mobile Engineer', status: 'invited', presence: 'offline' },
];

const AUTHORS = ['Marcus Rivera', 'Priya Patel', 'Jordan Lee', 'Sarah Kim', 'Emma Wilson', 'Noah Garcia', 'Alex Chen'];

interface ProjectSeed {
  id: string;
  name: string;
  description: string;
  repository: string;
  defaultBranch: string;
  status: Project['status'];
  language: string;
  tags: string[];
  ownerId: string;
  createdDaysAgo: number;
  services: string[];
  prTitles: string[];
}

const PROJECTS: ProjectSeed[] = [
  {
    id: 'atlas-web',
    name: 'Atlas Web Platform',
    description: 'Customer-facing Next.js application powering the product dashboard and analytics suite.',
    repository: 'acme/atlas-web',
    defaultBranch: 'main',
    status: 'active',
    language: 'TypeScript',
    tags: ['frontend', 'nextjs', 'tier-1'],
    ownerId: 'usr_priya',
    createdDaysAgo: 480,
    services: ['web-app', 'websocket-gateway', 'chart-renderer'],
    prTitles: [
      'Virtualize activity feed for long sessions',
      'Move dashboard filters to URL search params',
      'Add skeletons for streaming dashboard sections',
      'Fix focus trap in project settings dialog',
      'Memoize chart data transforms',
      'Replace moment with date-fns',
      'Add error boundary to analytics widgets',
      'Introduce typed route helpers',
      'Lazy-load the markdown renderer',
      'Improve table keyboard navigation',
      'Prefetch project detail on hover',
      'Adopt Server Actions for project settings',
    ],
  },
  {
    id: 'orion-gateway',
    name: 'Orion API Gateway',
    description: 'High-throughput gateway handling authentication, rate limiting and request routing for every service.',
    repository: 'acme/orion-gateway',
    defaultBranch: 'main',
    status: 'active',
    language: 'Go',
    tags: ['backend', 'infrastructure', 'tier-1'],
    ownerId: 'usr_sarah',
    createdDaysAgo: 620,
    services: ['auth-service', 'rate-limiter', 'database', 'api-gateway'],
    prTitles: [
      'Add structured logging to auth middleware',
      'Tune connection pool for burst traffic',
      'Expose rate limit headers',
      'Cache JWKS responses',
      'Add circuit breaker to upstream calls',
      'Split migrations from application deploys',
      'Upgrade Go to 1.25',
      'Trace propagation for gRPC routes',
    ],
  },
  {
    id: 'nimbus-ds',
    name: 'Nimbus Design System',
    description: 'Shared React component library and design tokens used by every product surface.',
    repository: 'acme/nimbus-ds',
    defaultBranch: 'main',
    status: 'active',
    language: 'TypeScript',
    tags: ['design-system', 'react', 'shared'],
    ownerId: 'usr_emma',
    createdDaysAgo: 400,
    services: ['component-library', 'docs-site'],
    prTitles: [
      'Add Combobox primitive',
      'Respect prefers-reduced-motion in transitions',
      'Ship tokens as CSS variables',
      'Fix Tooltip announcing twice to screen readers',
      'Add visual regression tests for Button',
      'Document Dialog focus management',
    ],
  },
  {
    id: 'pulse-mobile',
    name: 'Pulse Mobile',
    description: 'React Native app for on-call notifications, incident acknowledgement and status checks.',
    repository: 'acme/pulse-mobile',
    defaultBranch: 'develop',
    status: 'active',
    language: 'TypeScript',
    tags: ['mobile', 'react-native'],
    ownerId: 'usr_jordan',
    createdDaysAgo: 300,
    services: ['push-service', 'mobile-api'],
    prTitles: [
      'Add quiet hours to notification preferences',
      'Offline queue for incident acknowledgements',
      'Migrate navigation to typed routes',
      'Reduce cold start by deferring analytics',
      'Haptics on critical alerts',
    ],
  },
  {
    id: 'vertex-pipeline',
    name: 'Vertex Data Pipeline',
    description: 'Event ingestion and aggregation pipeline that feeds product analytics.',
    repository: 'acme/vertex-pipeline',
    defaultBranch: 'main',
    status: 'paused',
    language: 'Python',
    tags: ['data', 'etl'],
    ownerId: 'usr_noah',
    createdDaysAgo: 260,
    services: ['ingest-worker', 'aggregator'],
    prTitles: ['Backfill job for late events', 'Partition events table by day', 'Schema registry validation'],
  },
  {
    id: 'flux-docs',
    name: 'Flux Docs',
    description: 'Developer documentation portal with interactive API references.',
    repository: 'acme/flux-docs',
    defaultBranch: 'main',
    status: 'archived',
    language: 'MDX',
    tags: ['docs', 'internal'],
    ownerId: 'usr_emma',
    createdDaysAgo: 700,
    services: ['docs-site'],
    prTitles: ['Add search analytics', 'Fix broken anchor links'],
  },
];

/* -------------------------------------------------------------------------- */
/* Diff helpers                                                               */
/* -------------------------------------------------------------------------- */

function hunk(header: string, oldStart: number, newStart: number, raw: string): DiffHunk {
  let oldLine = oldStart;
  let newLine = newStart;
  const lines: DiffLine[] = raw
    .replace(/^\n/, '')
    .replace(/\n$/, '')
    .split('\n')
    .map((line) => {
      const marker = line[0];
      const content = line.slice(2);
      if (marker === '+') return { kind: 'add', content, oldNumber: null, newNumber: newLine++ };
      if (marker === '-') return { kind: 'remove', content, oldNumber: oldLine++, newNumber: null };
      return { kind: 'context', content, oldNumber: oldLine++, newNumber: newLine++ };
    });
  return { header, lines };
}

function countChanges(hunks: DiffHunk[]) {
  let additions = 0;
  let deletions = 0;
  for (const h of hunks) {
    for (const l of h.lines) {
      if (l.kind === 'add') additions++;
      if (l.kind === 'remove') deletions++;
    }
  }
  return { additions, deletions };
}

function file(path: string, status: FileChange['status'], hunks: DiffHunk[]): FileChange {
  return { path, status, hunks, ...countChanges(hunks) };
}

const HERO_FILES: Record<string, FileChange[]> = {
  'orion-gateway#312': [
    file('internal/middleware/ratelimit.go', 'modified', [
      hunk('@@ -28,14 +28,21 @@ func RateLimit(next http.Handler) http.Handler', 28, 28, `
  func RateLimit(next http.Handler) http.Handler {
  	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
- 		claims, ok := auth.FromContext(r.Context())
- 		if !ok && limiter.Allow(r.RemoteAddr) {
- 			next.ServeHTTP(w, r)
- 			return
- 		}
+ 		authMu.Lock()
+ 		claims, err := auth.Verify(r)
+ 		authMu.Unlock()
+ 		if err != nil {
+ 			http.Error(w, "unauthorized", http.StatusUnauthorized)
+ 			return
+ 		}
+ 		if !limiter.Allow(claims.Subject) {
+ 			w.Header().Set("Retry-After", "1")
+ 			http.Error(w, "too many requests", http.StatusTooManyRequests)
+ 			return
+ 		}
  		ctx := auth.WithClaims(r.Context(), claims)
  		next.ServeHTTP(w, r.WithContext(ctx))
  	})
  }`),
    ]),
    file('internal/middleware/ratelimit_test.go', 'modified', [
      hunk('@@ -41,6 +41,24 @@ func TestRateLimit(t *testing.T)', 41, 41, `
  	assertStatus(t, rec, http.StatusOK)
  }
+
+ func TestRateLimitRejectsUnauthenticatedBurst(t *testing.T) {
+ 	h := RateLimit(okHandler())
+ 	var wg sync.WaitGroup
+ 	for i := 0; i < 50; i++ {
+ 		wg.Add(1)
+ 		go func() {
+ 			defer wg.Done()
+ 			rec := httptest.NewRecorder()
+ 			h.ServeHTTP(rec, httptest.NewRequest("GET", "/v1/me", nil))
+ 			if rec.Code != http.StatusUnauthorized {
+ 				t.Errorf("expected 401, got %d", rec.Code)
+ 			}
+ 		}()
+ 	}
+ 	wg.Wait()
+ }`),
    ]),
    file('migrations/004_add_session_index.sql', 'added', [
      hunk('@@ -0,0 +1,4 @@', 0, 1, `
+ -- Speeds up session lookups performed by auth.Verify
+ CREATE INDEX idx_sessions_subject ON sessions (subject);
+ CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
+ ANALYZE sessions;`),
    ]),
    file('internal/config/database.go', 'modified', [
      hunk('@@ -12,7 +12,7 @@ var Defaults = Config{', 12, 12, `
  	MaxIdleConns:    10,
- 	MaxOpenConns:    50,
+ 	MaxOpenConns:    20,
  	ConnMaxLifetime: 30 * time.Minute,
  	StatementTimeout: 30 * time.Second,`),
    ]),
  ],
  'atlas-web#847': [
    file('src/features/presence/use-presence.ts', 'added', [
      hunk('@@ -0,0 +1,26 @@', 0, 1, `
+ import { useEffect, useState } from 'react';
+ import { connect } from './socket';
+
+ export function usePresence(widgetId: string) {
+   const [viewers, setViewers] = useState<string[]>([]);
+
+   useEffect(() => {
+     const socket = connect();
+     socket.on('presence', (payload: any) => {
+       if (payload.widgetId === widgetId) setViewers(payload.viewers);
+     });
+     socket.emit('join', widgetId);
+   }, [widgetId]);
+
+   return viewers;
+ }`),
    ]),
    file('src/features/dashboard/components/metric-card.tsx', 'modified', [
      hunk('@@ -14,9 +14,14 @@ export function MetricCard({ metric }: Props)', 14, 14, `
  export function MetricCard({ metric }: Props) {
+   const viewers = usePresence(metric.id);
    return (
      <Card>
-       <CardHeader>{metric.label}</CardHeader>
+       <CardHeader className="flex items-center justify-between">
+         <span>{metric.label}</span>
+         <div onClick={() => openViewers(viewers)}>
+           <AvatarStack names={viewers} />
+         </div>
+       </CardHeader>
        <CardContent>{metric.value}</CardContent>`),
    ]),
    file('src/features/presence/socket.ts', 'added', [
      hunk('@@ -0,0 +1,9 @@', 0, 1, `
+ import { io } from 'socket.io-client';
+
+ let socket: ReturnType<typeof io> | null = null;
+
+ export function connect() {
+   socket ??= io(process.env.NEXT_PUBLIC_WS_URL!, { reconnectionDelay: 3000 });
+   return socket;
+ }`),
    ]),
  ],
};

const GENERIC_PATHS: Record<string, string[]> = {
  TypeScript: [
    'src/features/dashboard/components/metric-grid.tsx',
    'src/components/data-table/data-table.tsx',
    'src/hooks/use-media-query.ts',
    'src/lib/format.ts',
    'src/app/(workspace)/projects/page.tsx',
    'src/features/projects/hooks/use-projects.ts',
  ],
  Go: ['internal/router/router.go', 'internal/auth/jwks.go', 'cmd/gateway/main.go', 'internal/limiter/bucket.go'],
  Python: ['pipeline/ingest.py', 'pipeline/aggregate.py', 'tests/test_ingest.py'],
  MDX: ['content/getting-started.mdx', 'components/search.tsx'],
};

function genericFiles(random: Random, language: string, count: number): FileChange[] {
  const paths = GENERIC_PATHS[language] ?? GENERIC_PATHS.TypeScript!;
  return Array.from({ length: count }, (_, i) => {
    const path = paths[i % paths.length]!;
    const start = random.int(10, 120);
    const ext = path.split('.').pop();
    const comment = ext === 'py' ? '#' : ext === 'mdx' ? '{/*' : '//';
    const h = hunk(`@@ -${start},6 +${start},8 @@`, start, start, `
  ${comment} ${path.split('/').pop()}
- const limit = 20;
+ const limit = DEFAULT_PAGE_SIZE;
+ const offset = (page - 1) * limit;
  return query(limit);`);
    return file(path, i === 0 && random.chance(0.3) ? 'added' : 'modified', [h]);
  });
}

/* -------------------------------------------------------------------------- */
/* Builders                                                                   */
/* -------------------------------------------------------------------------- */

function riskLevelFor(score: number): RiskLevel {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const CHECK_TEMPLATES: Omit<CheckRun, 'id' | 'status' | 'durationSeconds'>[] = [
  { name: 'Unit tests', summary: 'Vitest' },
  { name: 'Integration tests', summary: 'Test suite against ephemeral database' },
  { name: 'Lint', summary: 'ESLint / golangci-lint' },
  { name: 'Type check', summary: 'Static type analysis' },
  { name: 'Build', summary: 'Production build' },
  { name: 'Security scan', summary: 'Dependency & SAST scan' },
];

function buildChecks(random: Random, failedTests: number, prefix: string, forceSecurityFail = false): CheckRun[] {
  return CHECK_TEMPLATES.map((tpl, i) => {
    let status: CheckRun['status'] = 'success';
    if (i === 0 && failedTests > 0) status = 'failed';
    if (i === 5 && forceSecurityFail) status = 'failed';
    return { ...tpl, id: `${prefix}-chk-${i}`, status, durationSeconds: random.int(12, 180) };
  });
}

function buildCommits(random: Random, author: string, count: number, end: number, messages: string[]): Commit[] {
  return Array.from({ length: count }, (_, i) => ({
    sha: random.sha(),
    message: messages[i % messages.length]!,
    author,
    committedAt: new Date(end - (count - i) * random.int(1, 5) * HOUR).toISOString(),
    additions: random.int(4, 160),
    deletions: random.int(0, 60),
  }));
}

function buildPullRequests(random: Random, now: number): PullRequest[] {
  const prs: PullRequest[] = [];
  const statuses: PullRequestStatus[] = ['open', 'open', 'open', 'merged', 'merged', 'draft', 'closed'];
  const reviewStatuses: ReviewStatus[] = ['pending', 'approved', 'changes_requested', 'commented'];

  for (const project of PROJECTS) {
    const base = { 'atlas-web': 820, 'orion-gateway': 290, 'nimbus-ds': 180, 'pulse-mobile': 140, 'vertex-pipeline': 60, 'flux-docs': 30 }[project.id] ?? 1;

    project.prTitles.forEach((title, index) => {
      const number = base + index;
      const author = random.pick(AUTHORS);
      const status = project.status === 'archived' ? 'merged' : random.pick(statuses);
      const updated = now - random.int(1, 14 * 24) * HOUR;
      const created = updated - random.int(4, 72) * HOUR;
      const files = genericFiles(random, project.language, random.int(1, 5));
      const total = random.int(20, 220);
      const failed = random.chance(0.2) ? random.int(1, 6) : 0;
      const riskScore = Math.min(95, random.int(8, 60) + failed * 6);
      prs.push({
        id: `${project.id}#${number}`,
        projectId: project.id,
        number,
        title,
        description: `${title}. This change is scoped to ${files.length} file(s) and keeps the public API stable.`,
        author,
        status,
        reviewStatus: random.pick(reviewStatuses),
        branch: `${random.pick(['feat', 'fix', 'chore', 'perf'])}/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`,
        baseBranch: project.defaultBranch,
        filesChanged: files.length,
        additions: files.reduce((a, f) => a + f.additions, 0) + random.int(10, 300),
        deletions: files.reduce((a, f) => a + f.deletions, 0) + random.int(0, 120),
        tests: { passed: total - failed, failed, skipped: random.int(0, 4) },
        riskScore,
        riskLevel: riskLevelFor(riskScore),
        labels: [random.pick(['enhancement', 'refactor', 'bugfix', 'performance', 'a11y'])],
        createdAt: new Date(created).toISOString(),
        updatedAt: new Date(updated).toISOString(),
        reviewers: [random.pick(AUTHORS.filter((a) => a !== author))],
        commits: buildCommits(random, author, random.int(1, 4), updated, [`${title.toLowerCase()}`, 'address review feedback', 'add tests']),
        files,
        checks: buildChecks(random, failed, `${project.id}-${number}`),
        comments: [],
      });
    });
  }

  // Hero pull requests with hand-written diffs, comments and stories.
  const orionFiles = HERO_FILES['orion-gateway#312']!;
  prs.push({
    id: 'orion-gateway#312',
    projectId: 'orion-gateway',
    number: 312,
    title: 'Fix authentication bypass in rate limiting middleware under high load',
    description:
      'Under high concurrency the rate limiter evaluated `limiter.Allow` before verifying the token, letting unauthenticated requests through during bursts.\n\nThis PR:\n- verifies the token **before** applying the limit\n- keys the limiter by subject instead of remote address\n- adds a session index migration to speed up `auth.Verify`\n- lowers `MaxOpenConns` to protect the primary during bursts',
    author: 'Sarah Kim',
    status: 'merged',
    reviewStatus: 'approved',
    branch: 'fix/auth-bypass-rate-limit',
    baseBranch: 'main',
    filesChanged: orionFiles.length,
    additions: orionFiles.reduce((a, f) => a + f.additions, 0),
    deletions: orionFiles.reduce((a, f) => a + f.deletions, 0),
    tests: { passed: 65, failed: 2, skipped: 1 },
    riskScore: 82,
    riskLevel: 'high',
    labels: ['security', 'bugfix', 'database'],
    createdAt: new Date(now - 30 * HOUR).toISOString(),
    updatedAt: new Date(now - 3 * HOUR).toISOString(),
    reviewers: ['Marcus Rivera', 'Noah Garcia'],
    commits: [
      { sha: 'a91c3e0', message: 'fix(ratelimit): verify token before applying limit', author: 'Sarah Kim', committedAt: new Date(now - 28 * HOUR).toISOString(), additions: 13, deletions: 5 },
      { sha: '5d02b7f', message: 'test(ratelimit): cover unauthenticated bursts', author: 'Sarah Kim', committedAt: new Date(now - 26 * HOUR).toISOString(), additions: 18, deletions: 0 },
      { sha: 'c7e19aa', message: 'perf(db): add session index migration', author: 'Sarah Kim', committedAt: new Date(now - 20 * HOUR).toISOString(), additions: 4, deletions: 0 },
      { sha: 'b8e2c41', message: 'chore(db): lower max open connections to 20', author: 'Sarah Kim', committedAt: new Date(now - 6 * HOUR).toISOString(), additions: 1, deletions: 1 },
    ],
    files: orionFiles,
    checks: [
      { id: 'o312-1', name: 'Unit tests', status: 'failed', durationSeconds: 94, summary: '65 passed, 2 failed — TestSessionLookupTimeout, TestPoolSaturation' },
      { id: 'o312-2', name: 'Integration tests', status: 'success', durationSeconds: 211, summary: 'Ephemeral Postgres' },
      { id: 'o312-3', name: 'Lint', status: 'success', durationSeconds: 21, summary: 'golangci-lint' },
      { id: 'o312-4', name: 'Build', status: 'success', durationSeconds: 48, summary: 'go build ./...' },
      { id: 'o312-5', name: 'Security scan', status: 'success', durationSeconds: 37, summary: 'gosec: 0 issues' },
      { id: 'o312-6', name: 'Migration dry-run', status: 'skipped', durationSeconds: 0, summary: 'Skipped: no staging snapshot available' },
    ],
    comments: [
      { id: 'o312-c1', author: 'Marcus Rivera', body: 'A global mutex around `auth.Verify` will serialise every authenticated request. Can we scope the lock per subject?', createdAt: new Date(now - 24 * HOUR).toISOString(), kind: 'comment', path: 'internal/middleware/ratelimit.go', line: 31 },
      { id: 'o312-c2', author: 'Noah Garcia', body: 'The `CREATE INDEX` is not `CONCURRENTLY` — on the sessions table this takes a write lock in production.', createdAt: new Date(now - 18 * HOUR).toISOString(), kind: 'changes_requested', path: 'migrations/004_add_session_index.sql', line: 2 },
      { id: 'o312-c3', author: 'Alex Chen', body: 'Security fix is urgent — approving, please follow up on the lock scope.', createdAt: new Date(now - 7 * HOUR).toISOString(), kind: 'approval' },
    ],
  });

  const atlasFiles = HERO_FILES['atlas-web#847']!;
  prs.push({
    id: 'atlas-web#847',
    projectId: 'atlas-web',
    number: 847,
    title: 'Add real-time collaboration indicators to dashboard widgets',
    description:
      'Shows who else is looking at a dashboard widget using a WebSocket presence channel.\n\n- `usePresence` hook subscribes to the presence channel\n- `MetricCard` renders an avatar stack of current viewers\n- Socket singleton with reconnection',
    author: 'Marcus Rivera',
    status: 'open',
    reviewStatus: 'commented',
    branch: 'feat/realtime-presence',
    baseBranch: 'main',
    filesChanged: atlasFiles.length,
    additions: atlasFiles.reduce((a, f) => a + f.additions, 0),
    deletions: atlasFiles.reduce((a, f) => a + f.deletions, 0),
    tests: { passed: 142, failed: 0, skipped: 3 },
    riskScore: 46,
    riskLevel: 'medium',
    labels: ['enhancement', 'realtime'],
    createdAt: new Date(now - 26 * HOUR).toISOString(),
    updatedAt: new Date(now - 40 * MINUTE).toISOString(),
    reviewers: ['Priya Patel', 'Jordan Lee'],
    commits: [
      { sha: 'f3a7d92', message: 'feat(presence): add usePresence hook', author: 'Marcus Rivera', committedAt: new Date(now - 25 * HOUR).toISOString(), additions: 16, deletions: 0 },
      { sha: '1b9c004', message: 'feat(dashboard): show viewers on metric cards', author: 'Marcus Rivera', committedAt: new Date(now - 8 * HOUR).toISOString(), additions: 6, deletions: 1 },
      { sha: '77e01de', message: 'chore(presence): socket singleton', author: 'Marcus Rivera', committedAt: new Date(now - 2 * HOUR).toISOString(), additions: 8, deletions: 0 },
    ],
    files: atlasFiles,
    checks: buildChecks(random, 0, 'a847'),
    comments: [
      { id: 'a847-c1', author: 'Priya Patel', body: 'The effect never disconnects — we will leak listeners every time a card re-mounts.', createdAt: new Date(now - 5 * HOUR).toISOString(), kind: 'comment', path: 'src/features/presence/use-presence.ts', line: 9 },
    ],
  });

  return prs;
}

/* --------------------------------- Logs ----------------------------------- */

function buildLogs(start: number, env: Environment, failed: boolean, idPrefix: string): LogEntry[] {
  const lines: [LogEntry['level'], string, string][] = [
    ['info', 'builder', `Starting deployment to ${env}`],
    ['info', 'builder', 'Restoring build cache (hit: 94%)'],
    ['info', 'builder', 'Installing dependencies'],
    ['info', 'builder', 'Compiling application'],
    ['info', 'tests', 'Running test suite'],
    ['info', 'tests', failed ? '65 passed, 2 failed, 1 skipped' : 'All tests passed'],
    ['info', 'builder', 'Build artefact uploaded (12.4 MB)'],
    ['info', 'migrate', 'Running database migrations'],
  ];
  if (failed) {
    lines.push(
      ['warn', 'migrate', 'Migration 004_add_session_index acquiring lock on table "sessions"'],
      ['warn', 'database', 'Connection pool saturation: 19/20 connections in use'],
      ['warn', 'auth-service', 'p95 latency for POST /v1/token above SLO: 890ms'],
      ['error', 'database', 'canceling statement due to statement timeout (30000ms)'],
      ['error', 'migrate', 'Migration 004_add_session_index failed: context deadline exceeded'],
      ['error', 'auth-service', 'upstream connect error: pool exhausted (20/20)'],
      ['error', 'deployer', 'Health check /healthz failed 3 times — aborting rollout'],
      ['info', 'deployer', 'Rolling back to previous release v2026.10.04-2'],
      ['info', 'deployer', 'Rollback complete'],
    );
  } else {
    lines.push(
      ['info', 'migrate', 'No pending migrations'],
      ['info', 'deployer', 'Shifting traffic: 10% → 50% → 100%'],
      ['info', 'deployer', 'Health check /healthz → 200 OK'],
      ['info', 'deployer', 'Deployment completed successfully'],
    );
  }
  return lines.map(([level, source, message], i) => ({
    id: `${idPrefix}-log-${i}`,
    timestamp: new Date(start + i * 9_000).toISOString(),
    level,
    source,
    message,
  }));
}

function buildStages(start: number, status: DeploymentStatus, failedAt = 3): DeploymentStage[] {
  const names = ['Build', 'Test', 'Migrate', 'Deploy', 'Verify'];
  let cursor = start;
  return names.map((name, i) => {
    let stageStatus: DeploymentStage['status'] = 'success';
    if (status === 'failed') stageStatus = i < failedAt - 1 ? 'success' : i === failedAt - 1 ? 'failed' : 'skipped';
    if (status === 'in_progress') stageStatus = i < 2 ? 'success' : i === 2 ? 'running' : 'pending';
    if (status === 'queued') stageStatus = 'pending';
    if (status === 'cancelled') stageStatus = i === 0 ? 'success' : i === 1 ? 'failed' : 'skipped';
    const duration = stageStatus === 'skipped' || stageStatus === 'pending' ? 0 : [62, 94, 41, 55, 30][i]!;
    const stage: DeploymentStage = {
      id: `${start}-${i}`,
      name,
      status: stageStatus,
      startedAt: stageStatus === 'pending' || stageStatus === 'skipped' ? null : new Date(cursor).toISOString(),
      durationSeconds: duration,
    };
    cursor += duration * 1000;
    return stage;
  });
}

function buildPerformance(random: Random, failed: boolean, finished: boolean): Deployment['performance'] {
  const baseP95 = random.int(130, 190);
  const baseError = random.float(0.3, 0.9);
  const before: PerformanceSnapshot = {
    p50LatencyMs: Math.round(baseP95 * 0.45),
    p95LatencyMs: baseP95,
    errorRate: baseError,
    throughputRps: random.int(1800, 3200),
    cpuPercent: random.int(28, 46),
    memoryMb: random.int(420, 640),
  };
  const improve = random.chance(0.6);
  const after: PerformanceSnapshot | null = !finished
    ? null
    : failed
      ? { p50LatencyMs: 310, p95LatencyMs: 890, errorRate: 3.2, throughputRps: Math.round(before.throughputRps * 0.71), cpuPercent: 81, memoryMb: before.memoryMb + 220 }
      : {
          p50LatencyMs: Math.round(before.p50LatencyMs * (improve ? 0.9 : 1.06)),
          p95LatencyMs: Math.round(before.p95LatencyMs * (improve ? 0.88 : 1.07)),
          errorRate: Number((before.errorRate * (improve ? 0.8 : 1.1)).toFixed(2)),
          throughputRps: Math.round(before.throughputRps * (improve ? 1.08 : 0.98)),
          cpuPercent: before.cpuPercent + (improve ? -3 : 4),
          memoryMb: before.memoryMb + (improve ? -18 : 26),
        };

  const series: PerformancePoint[] = [];
  for (let minute = -30; minute <= 60; minute += 5) {
    const afterDeploy = minute >= 0 && finished;
    let p95 = before.p95LatencyMs + random.int(-12, 12);
    let err = before.errorRate + random.float(-0.1, 0.1);
    if (afterDeploy && after) {
      if (failed && minute <= 30) {
        p95 = 600 + random.int(150, 320) - minute * 3;
        err = 2.4 + random.float(0, 1.2);
      } else {
        p95 = after.p95LatencyMs + random.int(-10, 10);
        err = after.errorRate + random.float(-0.08, 0.08);
      }
    }
    series.push({ minute, p95LatencyMs: Math.max(40, p95), errorRate: Math.max(0.05, Number(err.toFixed(2))) });
  }
  return { before, after, series };
}

function buildDeployments(random: Random, now: number, prs: PullRequest[]): Deployment[] {
  const deployments: Deployment[] = [];
  const environments: Environment[] = ['production', 'staging', 'staging', 'preview'];

  for (const project of PROJECTS) {
    const projectPrs = prs.filter((p) => p.projectId === project.id && p.status === 'merged');
    const count = project.status === 'archived' ? 4 : project.status === 'paused' ? 6 : 12;
    const firstNumber = project.id === 'orion-gateway' ? 116 : random.int(40, 300);
    for (let i = 0; i < count; i++) {
      const number = firstNumber + i;
      const ageHours = (count - i) * random.int(8, 20) + (project.status === 'archived' ? 24 * 20 : 0);
      const start = now - ageHours * HOUR;
      const isLatest = i === count - 1;
      let status: DeploymentStatus = random.chance(0.12) ? 'failed' : random.chance(0.05) ? 'cancelled' : 'success';
      if (isLatest && project.id === 'pulse-mobile') status = 'in_progress';
      if (isLatest && project.id === 'vertex-pipeline') status = 'queued';
      const finished = status !== 'in_progress' && status !== 'queued';
      const durationSeconds = finished ? random.int(140, 320) : 0;
      const failed = status === 'failed';
      const total = random.int(40, 160);
      const testsFailed = failed ? random.int(1, 3) : 0;
      const pr = projectPrs.length ? random.pick(projectPrs) : null;
      deployments.push({
        id: `${project.id}~${number}`,
        projectId: project.id,
        number,
        status,
        environment: isLatest && project.id === 'pulse-mobile' ? 'staging' : random.pick(environments),
        commitSha: random.sha(),
        commitMessage: pr ? pr.title : 'chore: dependency updates',
        branch: project.defaultBranch,
        author: pr ? pr.author : random.pick(AUTHORS),
        durationSeconds,
        startedAt: new Date(start).toISOString(),
        finishedAt: finished ? new Date(start + durationSeconds * 1000).toISOString() : null,
        pullRequestId: pr?.id ?? null,
        tests: { passed: total - testsFailed, failed: testsFailed, skipped: random.int(0, 3) },
        url: finished && !failed ? `https://${project.id}-${number}.preview.acme.dev` : null,
        stages: buildStages(start, status),
        logs: buildLogs(start, 'staging', failed, `${project.id}-${number}`),
        changedFiles: pr ? pr.files.map(({ path, status: s, additions, deletions }) => ({ path, status: s, additions, deletions })) : [],
        performance: buildPerformance(random, failed, finished),
      });
    }
  }

  // Hero: the failed production deployment of PR #312.
  const pr312 = prs.find((p) => p.id === 'orion-gateway#312')!;
  const start = now - 2 * HOUR - 45 * MINUTE;
  deployments.push({
    id: 'orion-gateway~128',
    projectId: 'orion-gateway',
    number: 128,
    status: 'failed',
    environment: 'production',
    commitSha: 'b8e2c41',
    commitMessage: 'Fix authentication bypass in rate limiting middleware (#312)',
    branch: 'main',
    author: 'Sarah Kim',
    durationSeconds: 156,
    startedAt: new Date(start).toISOString(),
    finishedAt: new Date(start + 156_000).toISOString(),
    pullRequestId: pr312.id,
    tests: { passed: 65, failed: 2, skipped: 1 },
    url: null,
    stages: buildStages(start, 'failed', 3),
    logs: buildLogs(start, 'production', true, 'orion-128'),
    changedFiles: pr312.files.map(({ path, status, additions, deletions }) => ({ path, status, additions, deletions })),
    performance: buildPerformance(random, true, true),
  });

  // Hero: last healthy Atlas production deploy.
  const atlasStart = now - 90 * MINUTE;
  const atlasPr = prs.find((p) => p.projectId === 'atlas-web' && p.status === 'merged') ?? null;
  deployments.push({
    id: 'atlas-web~512',
    projectId: 'atlas-web',
    number: 512,
    status: 'success',
    environment: 'production',
    commitSha: '3fd8a10',
    commitMessage: atlasPr?.title ?? 'Release 2026.10.05',
    branch: 'main',
    author: atlasPr?.author ?? 'Priya Patel',
    durationSeconds: 248,
    startedAt: new Date(atlasStart).toISOString(),
    finishedAt: new Date(atlasStart + 248_000).toISOString(),
    pullRequestId: atlasPr?.id ?? null,
    tests: { passed: 412, failed: 0, skipped: 6 },
    url: 'https://atlas.acme.dev',
    stages: buildStages(atlasStart, 'success'),
    logs: buildLogs(atlasStart, 'production', false, 'atlas-512'),
    changedFiles: atlasPr ? atlasPr.files.map(({ path, status, additions, deletions }) => ({ path, status, additions, deletions })) : [],
    performance: buildPerformance(random, false, true),
  });

  return deployments.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/* ------------------------------- Incidents -------------------------------- */

function incidentTimeline(id: string, start: number, opts: { deploymentHref?: string; status: IncidentStatus; assignee: string | null; service: string }): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const at = (minutes: number) => new Date(start + minutes * MINUTE).toISOString();
  if (opts.deploymentHref) {
    events.push({ id: `${id}-e1`, type: 'deployment', title: 'Production deployment started', description: 'Deployment #128 (b8e2c41) began rolling out to production.', occurredAt: at(-8), actor: 'Sarah Kim', href: opts.deploymentHref, metadata: { commit: 'b8e2c41', environment: 'production' } });
  }
  events.push(
    { id: `${id}-e2`, type: 'error', title: 'Error rate spike', description: `5xx rate on ${opts.service} rose from 0.6% to 3.2% within two minutes.`, occurredAt: at(-5), actor: null, metadata: { from: '0.6%', to: '3.2%' } },
    { id: `${id}-e3`, type: 'latency', title: 'Latency above SLO', description: 'p95 latency for POST /v1/token reached 890ms (SLO 300ms).', occurredAt: at(-3), actor: null, metadata: { p95: '890ms', slo: '300ms' } },
    { id: `${id}-e4`, type: 'created', title: 'Incident opened', description: 'Opened automatically by the SLO burn-rate alert.', occurredAt: at(0), actor: 'Monitoring' },
  );
  if (opts.status !== 'investigating' || opts.assignee) {
    events.push({ id: `${id}-e5`, type: 'investigation', title: 'Investigation started', description: `${opts.assignee ?? 'On-call'} acknowledged and took incident command.`, occurredAt: at(6), actor: opts.assignee });
  }
  if (opts.status === 'monitoring' || opts.status === 'resolved' || opts.status === 'identified') {
    events.push({ id: `${id}-e6`, type: 'mitigation', title: 'Mitigation applied', description: 'Rolled back to the previous release and drained saturated connections.', occurredAt: at(24), actor: opts.assignee });
  }
  if (opts.status === 'resolved') {
    events.push({ id: `${id}-e7`, type: 'resolution', title: 'Incident resolved', description: 'Error rate and latency back within SLO for 30 minutes.', occurredAt: at(70), actor: opts.assignee });
  }
  return events;
}

function buildIncidents(now: number, deployments: Deployment[]): Incident[] {
  const heroDeploy = deployments.find((d) => d.id === 'orion-gateway~128')!;
  const heroStart = new Date(heroDeploy.startedAt).getTime() + 8 * MINUTE;
  const seeds: {
    id: string; projectId: string; title: string; description: string; severity: IncidentSeverity; status: IncidentStatus;
    service: string; assignee: string | null; affectedUsers: number; startedMinutesAgo: number; related?: string;
  }[] = [
    { id: 'inc-42', projectId: 'orion-gateway', title: 'Authentication timeouts on API gateway', description: 'Users intermittently fail to sign in. Token issuance requests time out and the 5xx rate on auth-service is above SLO since the latest production deployment.', severity: 'sev1', status: 'investigating', service: 'auth-service', assignee: 'Sarah Kim', affectedUsers: 1240, startedMinutesAgo: Math.round((now - heroStart) / MINUTE), related: heroDeploy.id },
    { id: 'inc-41', projectId: 'orion-gateway', title: 'Database connection pool exhaustion', description: 'The primary database connection pool is saturated, causing cascading timeouts in services that share it.', severity: 'sev2', status: 'identified', service: 'database', assignee: 'Noah Garcia', affectedUsers: 3400, startedMinutesAgo: Math.round((now - heroStart) / MINUTE) - 4, related: heroDeploy.id },
    { id: 'inc-40', projectId: 'atlas-web', title: 'Dashboard widgets blank behind corporate proxies', description: 'Some customers on restrictive networks see empty widgets; WebSocket upgrade is blocked and there is no polling fallback.', severity: 'sev3', status: 'monitoring', service: 'websocket-gateway', assignee: 'Marcus Rivera', affectedUsers: 87, startedMinutesAgo: 300 },
    { id: 'inc-39', projectId: 'atlas-web', title: 'Slow chart rendering on large datasets', description: 'Charts with more than 5k points block the main thread for over 400ms.', severity: 'sev4', status: 'resolved', service: 'chart-renderer', assignee: 'Jordan Lee', affectedUsers: 23, startedMinutesAgo: 60 * 50 },
    { id: 'inc-38', projectId: 'orion-gateway', title: 'Rate limiter blocking legitimate traffic', description: 'A configuration change made the limiter too aggressive for high-volume API clients.', severity: 'sev3', status: 'resolved', service: 'rate-limiter', assignee: 'Sarah Kim', affectedUsers: 450, startedMinutesAgo: 60 * 76 },
    { id: 'inc-37', projectId: 'pulse-mobile', title: 'Push notifications delayed on Android', description: 'FCM batching caused notification delays of up to 4 minutes.', severity: 'sev3', status: 'resolved', service: 'push-service', assignee: 'Jordan Lee', affectedUsers: 610, startedMinutesAgo: 60 * 120 },
    { id: 'inc-36', projectId: 'nimbus-ds', title: 'Docs site returning 404 for versioned pages', description: 'Versioned documentation routes were not generated in the last release.', severity: 'sev4', status: 'resolved', service: 'docs-site', assignee: 'Emma Wilson', affectedUsers: 40, startedMinutesAgo: 60 * 160 },
  ];

  return seeds.map((s) => {
    const start = now - s.startedMinutesAgo * MINUTE;
    const relatedDeploy = s.related ? deployments.find((d) => d.id === s.related) : undefined;
    const deploymentHref = relatedDeploy ? `/projects/${relatedDeploy.projectId}/deployments/${relatedDeploy.number}` : undefined;
    return {
      id: s.id,
      projectId: s.projectId,
      reference: s.id.toUpperCase(),
      title: s.title,
      description: s.description,
      severity: s.severity,
      status: s.status,
      service: s.service,
      assignee: s.assignee,
      affectedUsers: s.affectedUsers,
      createdAt: new Date(start).toISOString(),
      resolvedAt: s.status === 'resolved' ? new Date(start + 70 * MINUTE).toISOString() : null,
      relatedDeploymentId: s.related ?? null,
      timeline: incidentTimeline(s.id, start, { deploymentHref, status: s.status, assignee: s.assignee, service: s.service }),
    };
  });
}

/* -------------------------------- Projects -------------------------------- */

function buildProjects(now: number, prs: PullRequest[], deployments: Deployment[], incidents: Incident[]): Project[] {
  return PROJECTS.map((p) => {
    const projectDeploys = deployments.filter((d) => d.projectId === p.id);
    const latest = projectDeploys[0];
    const openPrs = prs.filter((pr) => pr.projectId === p.id && (pr.status === 'open' || pr.status === 'draft')).length;
    const active = incidents.filter((i) => i.projectId === p.id && i.status !== 'resolved');
    const failures = projectDeploys.filter((d) => d.status === 'failed').length;
    const health = Math.max(
      35,
      Math.min(99, 96 - active.reduce((acc, i) => acc + ({ sev1: 18, sev2: 10, sev3: 5, sev4: 2 }[i.severity]), 0) - failures * 3 - (p.status === 'paused' ? 12 : 0)),
    );
    return {
      id: p.id,
      slug: p.id,
      name: p.name,
      description: p.description,
      repository: p.repository,
      defaultBranch: p.defaultBranch,
      status: p.status,
      deploymentStatus: latest?.status ?? 'queued',
      openPullRequests: openPrs,
      activeIncidents: active.length,
      healthScore: health,
      lastDeploymentAt: latest?.startedAt ?? null,
      language: p.language,
      tags: p.tags,
      ownerId: p.ownerId,
      createdAt: new Date(now - p.createdDaysAgo * DAY).toISOString(),
    };
  });
}

export function projectServices(projectId: string): string[] {
  return PROJECTS.find((p) => p.id === projectId)?.services ?? [];
}

export function createDataset(now: number = Date.now(), seed = 20261005): Dataset {
  const random = createRandom(seed);
  const pullRequests = buildPullRequests(random, now);
  const deployments = buildDeployments(random, now, pullRequests);
  const incidents = buildIncidents(now, deployments);
  const projects = buildProjects(now, pullRequests, deployments, incidents);
  const members: TeamMember[] = MEMBERS.map((m, i) => ({
    ...m,
    lastActiveAt: new Date(now - (m.presence === 'online' ? i * 3 : m.presence === 'away' ? 50 + i * 10 : 26 * 60 + i * 90) * MINUTE).toISOString(),
  }));

  const notifications: Notification[] = [
    { id: 'ntf-1', kind: 'incident', title: 'SEV1 · INC-42 opened', body: 'Authentication timeouts on API gateway', href: '/projects/orion-gateway/incidents/inc-42', createdAt: incidents[0]!.createdAt, read: false },
    { id: 'ntf-2', kind: 'deployment', title: 'Deployment #128 failed', body: 'Orion API Gateway · production · migration timeout', href: '/projects/orion-gateway/deployments/128', createdAt: new Date(now - 2 * HOUR - 40 * MINUTE).toISOString(), read: false },
    { id: 'ntf-3', kind: 'review', title: 'Review requested on #847', body: 'Marcus Rivera requested your review', href: '/projects/atlas-web/pull-requests/847', createdAt: new Date(now - 5 * HOUR).toISOString(), read: false },
    { id: 'ntf-4', kind: 'mention', title: 'Mentioned in #312', body: 'Noah Garcia: “@alex the index is not CONCURRENTLY”', href: '/projects/orion-gateway/pull-requests/312', createdAt: new Date(now - 18 * HOUR).toISOString(), read: true },
  ];

  return { members, projects, pullRequests, deployments, incidents, notifications };
}
