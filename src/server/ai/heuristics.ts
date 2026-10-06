import type { DeploymentAnalysis, IncidentAnalysis, PRAnalysis, PRFinding, Recommendation } from '@/schemas/ai';
import type { Deployment, Incident, PullRequest, RiskLevel } from '@/types/domain';

/**
 * "Demo model": a deterministic, rule-based analyser used when no LLM is
 * configured. It inspects the real diff, checks, logs and timeline, and
 * returns output that satisfies exactly the same Zod schemas as the LLM path,
 * so the UI cannot tell the difference — and tests are deterministic.
 */

const SEVERITY_WEIGHT: Record<RiskLevel, number> = { low: 6, medium: 14, high: 24, critical: 34 };

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

interface DiffRule {
  test: (line: string, context: { path: string; addedLines: string[] }) => boolean;
  finding: Omit<PRFinding, 'id' | 'file' | 'line'>;
}

const DIFF_RULES: DiffRule[] = [
  {
    test: (l) => /:\s*any\b|as any\b/.test(l),
    finding: { category: 'Type Safety', severity: 'medium', title: 'Untyped `any` payload', description: 'An `any` type disables type checking for this value and everything derived from it.', suggestion: 'Model the payload with a Zod schema or a discriminated union and narrow it before use.' },
  },
  {
    test: (l) => /process\.env\.[A-Z_]+!/.test(l),
    finding: { category: 'Type Safety', severity: 'low', title: 'Non-null assertion on environment variable', description: 'A missing variable will surface as a runtime failure far from its cause.', suggestion: 'Validate environment variables once at startup and export a typed config object.' },
  },
  {
    test: (l, ctx) => /useEffect\(/.test(l) && !ctx.addedLines.some((x) => /return\s*\(\)\s*=>|return\s+\(\)|return\s+cleanup|\.off\(|disconnect\(/.test(x)),
    finding: { category: 'Performance', severity: 'high', title: 'Effect subscribes without cleanup', description: 'The effect registers listeners but never unsubscribes. Each re-mount adds another listener, leaking memory and duplicating state updates.', suggestion: 'Return a cleanup function that removes the listener and leaves the channel (`socket.off(...)`).' },
  },
  {
    test: (l) => /<div[^>]*onClick=/.test(l),
    finding: { category: 'Accessibility', severity: 'medium', title: 'Click handler on a non-interactive element', description: 'A `div` with `onClick` is not focusable and has no role, so keyboard and screen-reader users cannot activate it.', suggestion: 'Use a `<button type="button">` (or add role, tabIndex and key handlers) with an accessible label.' },
  },
  {
    test: (l) => /\b(authMu|mu|mutex)\.Lock\(\)/i.test(l),
    finding: { category: 'Performance', severity: 'critical', title: 'Global lock on the request hot path', description: 'A process-wide mutex around token verification serialises every authenticated request. Under load this becomes a self-inflicted outage.', suggestion: 'Remove the lock (verification is read-only) or scope it per subject with a sharded lock.' },
  },
  {
    test: (l) => /CREATE INDEX(?! CONCURRENTLY)/i.test(l),
    finding: { category: 'Performance', severity: 'high', title: 'Blocking index creation in migration', description: '`CREATE INDEX` without `CONCURRENTLY` takes a write lock on the table for the duration of the build.', suggestion: 'Use `CREATE INDEX CONCURRENTLY` and run migrations as a separate, pre-deploy step.' },
  },
  {
    test: (l) => /MaxOpenConns:\s*\d+/.test(l),
    finding: { category: 'Performance', severity: 'high', title: 'Connection pool size reduced', description: 'Lowering the maximum open connections while adding synchronous auth lookups increases the risk of pool exhaustion during bursts.', suggestion: 'Load-test the new pool size or keep the previous limit until the lock contention is removed.' },
  },
  {
    test: (l) => /reconnectionDelay:\s*\d+/.test(l),
    finding: { category: 'Maintainability', severity: 'low', title: 'Fixed reconnection delay', description: 'A constant delay causes synchronised reconnect storms after an outage.', suggestion: 'Use exponential backoff with jitter (e.g. 1s → 30s).' },
  },
];

const TEST_PATH = /(\.test\.|\.spec\.|_test\.go$|\/tests?\/)/;
/** Files that never need tests: docs, SQL migrations, assets, lockfiles, licences. */
const NON_CODE_PATH = /(\.(md|mdx|txt|rst|sql|png|jpe?g|gif|svg|ico|webp)$|(^|\/)(LICENSE|CHANGELOG|CODEOWNERS)[^/]*$|(^|\/)docs?\/|(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$)/i;

export function analyzePullRequestHeuristic(pr: PullRequest): PRAnalysis {
  const findings: PRFinding[] = [];
  const push = (f: Omit<PRFinding, 'id'>) => {
    if (findings.some((x) => x.title === f.title && x.file === f.file)) return;
    findings.push({ ...f, id: `f${findings.length + 1}` });
  };

  for (const file of pr.files) {
    const added = file.hunks.flatMap((h) => h.lines.filter((l) => l.kind === 'add'));
    const addedLines = added.map((l) => l.content);
    for (const line of added) {
      for (const rule of DIFF_RULES) {
        if (rule.test(line.content, { path: file.path, addedLines })) {
          push({ ...rule.finding, file: file.path, line: line.newNumber });
        }
      }
    }
  }

  if (pr.tests.failed > 0) {
    const failing = pr.checks.find((c) => c.status === 'failed' && /test/i.test(c.name));
    push({ category: 'Testing', severity: pr.tests.failed > 3 ? 'critical' : 'high', title: `${pr.tests.failed} failing test${pr.tests.failed > 1 ? 's' : ''}`, description: failing?.summary ?? 'The test suite is red for this branch.', file: null, line: null, suggestion: 'Fix or quarantine the failing tests before merging; do not deploy on a red build.' });
  }
  const skipped = pr.checks.find((c) => c.status === 'skipped');
  if (skipped) {
    push({ category: 'Testing', severity: 'medium', title: `Check skipped: ${skipped.name}`, description: skipped.summary, file: null, line: null, suggestion: 'Make this check required for changes that touch migrations or infrastructure.' });
  }
  const securityFailed = pr.checks.find((c) => c.status === 'failed' && /security/i.test(c.name));
  if (securityFailed) {
    push({ category: 'Security', severity: 'high', title: 'Security scan failed', description: securityFailed.summary, file: null, line: null, suggestion: 'Review the scanner output and patch or explicitly accept each issue.' });
  }
  if (pr.labels.includes('security')) {
    push({ category: 'Security', severity: 'medium', title: 'Security-sensitive change', description: 'The PR modifies authentication/authorisation behaviour. Regressions here are high impact and hard to detect.', file: null, line: null, suggestion: 'Require a second reviewer from the security rotation and add negative tests.' });
  }
  const sourceFiles = pr.files.filter((f) => !TEST_PATH.test(f.path) && !NON_CODE_PATH.test(f.path));
  const testFiles = pr.files.filter((f) => TEST_PATH.test(f.path));
  if (sourceFiles.length > 0 && testFiles.length === 0) {
    push({ category: 'Testing', severity: 'medium', title: 'No tests accompany the change', description: `${sourceFiles.length} source file(s) changed without corresponding test updates.`, file: sourceFiles[0]!.path, line: null, suggestion: 'Add behaviour tests (React Testing Library / table-driven tests) that cover the new paths.' });
  }
  for (const comment of pr.comments.filter((c) => c.kind === 'changes_requested')) {
    push({ category: 'Maintainability', severity: 'medium', title: `Unresolved review: ${comment.author}`, description: comment.body, file: comment.path ?? null, line: comment.line ?? null, suggestion: 'Resolve or explicitly reply to the requested change before merging.' });
  }
  if (findings.length === 0) {
    push({ category: 'Maintainability', severity: 'low', title: 'No blocking issues detected', description: 'The change is small, tested and follows existing patterns.', file: null, line: null, suggestion: null });
  }

  const sizePenalty = Math.min(15, Math.round((pr.additions + pr.deletions) / 60));
  const riskScore = Math.min(98, Math.max(5, 8 + sizePenalty + findings.reduce((acc, f) => acc + SEVERITY_WEIGHT[f.severity], 0) / 1.6));
  const score = Math.round(riskScore);
  const riskLevel = riskLevelFromScore(score);

  const order: RiskLevel[] = ['critical', 'high', 'medium', 'low'];
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));

  const recommendations: Recommendation[] = findings
    .filter((f) => f.suggestion)
    .slice(0, 4)
    .map((f, i) => ({
      id: `r${i + 1}`,
      priority: f.severity === 'critical' || f.severity === 'high' ? 'high' : f.severity === 'medium' ? 'medium' : 'low',
      action: f.suggestion!,
      rationale: f.title,
    }));

  const top = findings[0]!;
  const counts = findings.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f.category]: (acc[f.category] ?? 0) + 1 }), {});
  const categories = Object.entries(counts)
    .map(([c, n]) => `${n} ${c.toLowerCase()}`)
    .join(', ');
  const summary =
    riskLevel === 'low'
      ? `Low-risk change across ${pr.filesChanged} file(s). ${categories ? `Minor notes: ${categories}.` : ''}`.trim()
      : `${riskLevel[0]!.toUpperCase()}${riskLevel.slice(1)} risk. The most important issue is “${top.title}”${top.file ? ` in \`${top.file}\`` : ''}. Findings: ${categories}. ${pr.tests.failed > 0 ? 'The build is red, so this should not be deployed as-is.' : 'Tests are green, but the findings above are not covered by them.'}`;

  return { riskScore: score, riskLevel, summary, findings, recommendations };
}

export function analyzeDeploymentHeuristic(deployment: Deployment, pr: PullRequest | null): DeploymentAnalysis {
  const errors = deployment.logs.filter((l) => l.level === 'error');
  const warnings = deployment.logs.filter((l) => l.level === 'warn');
  const failedStage = deployment.stages.find((s) => s.status === 'failed');
  const { before, after } = deployment.performance;
  const evidence: DeploymentAnalysis['evidence'] = [];
  const add = (label: string, detail: string, source: DeploymentAnalysis['evidence'][number]['source']) => evidence.push({ id: `e${evidence.length + 1}`, label, detail, source });

  if (failedStage) add(`${failedStage.name} stage failed`, `Pipeline stopped at “${failedStage.name}” after ${failedStage.durationSeconds}s.`, 'logs');
  errors.slice(0, 3).forEach((e) => add(`[${e.source}] error`, e.message, 'logs'));
  warnings.slice(0, 2).forEach((w) => add(`[${w.source}] warning`, w.message, 'logs'));
  if (after) {
    const latencyDelta = Math.round(((after.p95LatencyMs - before.p95LatencyMs) / before.p95LatencyMs) * 100);
    if (Math.abs(latencyDelta) >= 5) add('p95 latency', `${before.p95LatencyMs}ms → ${after.p95LatencyMs}ms (${latencyDelta > 0 ? '+' : ''}${latencyDelta}%)`, 'metrics');
    if (after.errorRate - before.errorRate > 0.3) add('Error rate', `${before.errorRate}% → ${after.errorRate}%`, 'metrics');
  }
  if (deployment.tests.failed > 0) add('Failing tests shipped', `${deployment.tests.failed} test(s) failed in the pipeline.`, 'tests');
  const migration = deployment.changedFiles.find((f) => /migrations?\//.test(f.path));
  if (migration) add('Schema migration included', migration.path, 'changes');
  const config = deployment.changedFiles.find((f) => /config/.test(f.path));
  if (config) add('Runtime configuration changed', config.path, 'changes');

  const failed = deployment.status === 'failed';
  const regressed = !!after && (after.p95LatencyMs > before.p95LatencyMs * 1.25 || after.errorRate > before.errorRate + 0.5);
  const risk: RiskLevel = failed && deployment.environment === 'production' ? 'critical' : failed || regressed ? 'high' : deployment.tests.failed > 0 ? 'medium' : 'low';

  const sources = [...new Set(errors.map((e) => e.source))];
  const possibleCause = failed
    ? migration
      ? `The migration in \`${migration.path}\` held a lock on a hot table while the connection pool${config ? ' (reduced in the same change)' : ''} saturated. Statement timeouts aborted the migration and health checks failed, triggering an automatic rollback.`
      : `The ${failedStage?.name ?? 'deploy'} stage failed: ${errors[0]?.message ?? 'see logs'}.`
    : regressed
      ? 'The release completed but introduced a performance regression visible right after traffic shifted.'
      : 'No anomaly detected. The release completed and post-deploy metrics are within normal variance.';

  const affectedAreas = failed || regressed ? [...new Set([...sources.filter((s) => !['deployer', 'migrate'].includes(s)), ...(pr ? pr.files.slice(0, 2).map((f) => f.path) : [])])] : [];

  const recommendedActions: Recommendation[] = failed
    ? [
        { id: 'r1', priority: 'high', action: 'Keep the rollback in place and freeze further deploys of this service', rationale: 'The current release is unhealthy.' },
        ...(migration ? [{ id: 'r2', priority: 'high' as const, action: 'Rewrite the migration with CREATE INDEX CONCURRENTLY and run it as a separate step', rationale: 'Avoids table locks during peak traffic.' }] : []),
        ...(config ? [{ id: 'r3', priority: 'medium' as const, action: 'Restore the previous connection pool size', rationale: 'Pool saturation amplified the failure.' }] : []),
        { id: 'r4', priority: 'medium', action: 'Make failing tests a hard gate for production deploys', rationale: `${deployment.tests.failed} failing test(s) were shipped.` },
      ]
    : regressed
      ? [{ id: 'r1', priority: 'high', action: 'Compare flame graphs before/after and consider rolling back', rationale: 'Latency regression after release.' }]
      : [{ id: 'r1', priority: 'low', action: 'Monitor error rate for 30 minutes and close the release', rationale: 'Metrics are healthy.' }];

  return { risk, possibleCause, evidence, affectedAreas, recommendedActions, confidence: failed ? 0.86 : regressed ? 0.72 : 0.9 };
}

export function investigateIncidentHeuristic(incident: Incident, deployment: Deployment | null, pr: PullRequest | null): IncidentAnalysis {
  const evidence: IncidentAnalysis['evidence'] = [];
  const add = (label: string, detail: string, href: string | null = null) => evidence.push({ id: `e${evidence.length + 1}`, label, detail, href });

  const created = new Date(incident.createdAt).getTime();
  if (deployment) {
    const minutes = Math.round((created - new Date(deployment.startedAt).getTime()) / 60_000);
    add(`Deployment #${deployment.number} preceded the incident`, `${deployment.environment} release of ${deployment.commitSha} started ${minutes} min before the incident was opened (status: ${deployment.status}).`, `/projects/${deployment.projectId}/deployments/${deployment.number}`);
    deployment.logs.filter((l) => l.level === 'error').slice(0, 2).forEach((l) => add(`Deploy log · ${l.source}`, l.message, `/projects/${deployment.projectId}/deployments/${deployment.number}?tab=logs`));
  }
  incident.timeline.filter((e) => e.type === 'error' || e.type === 'latency').forEach((e) => add(e.title, e.description));
  if (pr) add(`Change introduced by PR #${pr.number}`, pr.title, `/projects/${pr.projectId}/pull-requests/${pr.number}`);

  const services = [incident.service, ...(deployment ? [...new Set(deployment.logs.filter((l) => l.level !== 'info').map((l) => l.source))].filter((s) => !['deployer', 'migrate', 'builder', 'tests'].includes(s)) : [])];

  const likelyCause = deployment
    ? deployment.status === 'failed'
      ? `Deployment #${deployment.number} ran a blocking migration that saturated the database connection pool; requests to ${incident.service} queued behind it and timed out. The automatic rollback restored the code but not the pool state.`
      : `Deployment #${deployment.number} correlates with the onset of the incident; the change set is the most likely trigger.`
    : `No deployment correlates with the incident window. The issue is likely environmental (traffic pattern or dependency) affecting ${incident.service}.`;

  const recommendations: Recommendation[] = [
    ...(deployment?.status === 'failed' ? [{ id: 'r1', priority: 'high' as const, action: 'Recycle the database connection pool and confirm the rollback is complete', rationale: 'Saturated connections persist after code rollback.' }] : []),
    { id: 'r2', priority: 'high', action: `Page the ${incident.service} owner and post a status update`, rationale: `${incident.affectedUsers.toLocaleString('en-US')} users are affected.` },
    ...(pr ? [{ id: 'r3', priority: 'medium' as const, action: `Revert or fix PR #${pr.number} before redeploying`, rationale: 'It contains the triggering change.' }] : []),
    { id: 'r4', priority: 'low', action: 'Schedule a blameless post-mortem and add an alert on pool saturation', rationale: 'Detect the failure mode earlier next time.' },
  ];

  return {
    summary: `${incident.reference} (${incident.severity.toUpperCase()}) affects ${incident.affectedUsers.toLocaleString('en-US')} users of ${incident.service}. ${deployment ? `It began ${Math.round((created - new Date(deployment.startedAt).getTime()) / 60_000)} minutes after deployment #${deployment.number}.` : 'No recent deployment correlates with it.'}`,
    likelyCause,
    evidence,
    affectedServices: [...new Set(services)],
    recommendations,
    confidence: deployment ? (deployment.status === 'failed' ? 0.84 : 0.66) : 0.45,
  };
}
