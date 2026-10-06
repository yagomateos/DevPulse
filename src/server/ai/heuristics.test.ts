import { describe, expect, it } from 'vitest';
import { deploymentAnalysisSchema, incidentAnalysisSchema, prAnalysisSchema } from '@/schemas/ai';
import { createDataset } from '../data/dataset';
import { analyzeDeploymentHeuristic, analyzePullRequestHeuristic, investigateIncidentHeuristic, riskLevelFromScore } from './heuristics';
import { detectIntent } from './chat';

const data = createDataset(Date.UTC(2026, 9, 5, 10));
const pr312 = data.pullRequests.find((p) => p.id === 'orion-gateway#312')!;
const pr847 = data.pullRequests.find((p) => p.id === 'atlas-web#847')!;
const deploy128 = data.deployments.find((d) => d.id === 'orion-gateway~128')!;
const inc42 = data.incidents.find((i) => i.id === 'inc-42')!;

describe('demo model: pull request analysis', () => {
  it('finds the global lock, blocking migration and failing tests in PR #312', () => {
    const result = prAnalysisSchema.parse(analyzePullRequestHeuristic(pr312));
    const titles = result.findings.map((f) => f.title);
    expect(titles).toContain('Global lock on the request hot path');
    expect(titles).toContain('Blocking index creation in migration');
    expect(titles).toContain('2 failing tests');
    expect(result.findings[0]!.severity).toBe('critical');
    expect(['high', 'critical']).toContain(result.riskLevel);
    const lock = result.findings.find((f) => f.title.startsWith('Global lock'))!;
    expect(lock).toMatchObject({ file: 'internal/middleware/ratelimit.go', category: 'Performance' });
    expect(lock.line).toBeGreaterThan(0);
  });

  it('flags React-specific issues in PR #847 (any, missing cleanup, div onClick)', () => {
    const result = analyzePullRequestHeuristic(pr847);
    const categories = new Set(result.findings.map((f) => f.category));
    expect(categories).toEqual(expect.objectContaining(new Set(['Type Safety', 'Performance', 'Accessibility'])));
    expect(result.findings.some((f) => f.title === 'Effect subscribes without cleanup')).toBe(true);
  });

  it('does not ask for tests on docs-only changes, but still does for code', () => {
    const file = (path: string) => ({ path, status: 'modified' as const, additions: 1, deletions: 1, hunks: [] });
    const base = { ...pr847, comments: [], checks: [], labels: [], tests: { passed: 0, failed: 0, skipped: 0 } };
    const missingTests = (paths: string[]) => analyzePullRequestHeuristic({ ...base, files: paths.map(file) }).findings.some((f) => f.title === 'No tests accompany the change');
    expect(missingTests(['README.md', 'docs/setup.md', 'LICENSE', 'package-lock.json', 'public/logo.svg'])).toBe(false);
    expect(missingTests(['README.md', 'src/app.ts'])).toBe(true);
  });

  it('maps scores to risk levels', () => {
    expect([10, 45, 70, 90].map(riskLevelFromScore)).toEqual(['low', 'medium', 'high', 'critical']);
  });
});

describe('demo model: deployment & incident analysis', () => {
  it('rates the failed production deployment as critical with log and metric evidence', () => {
    const result = deploymentAnalysisSchema.parse(analyzeDeploymentHeuristic(deploy128, pr312));
    expect(result.risk).toBe('critical');
    expect(result.evidence.map((e) => e.source)).toEqual(expect.arrayContaining(['logs', 'metrics', 'changes']));
    expect(result.possibleCause).toMatch(/migration/);
  });

  it('correlates INC-42 with deployment #128 and links the evidence', () => {
    const result = incidentAnalysisSchema.parse(investigateIncidentHeuristic(inc42, deploy128, pr312));
    expect(result.evidence[0]).toMatchObject({ href: '/projects/orion-gateway/deployments/128' });
    expect(result.affectedServices).toContain('auth-service');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});

describe('assistant intent detection', () => {
  it.each([
    ['Which deployment caused the latest incident?', 'incident-cause'],
    ['Which PRs are risky?', 'risky-prs'],
    ['What changed this week?', 'what-changed'],
    ['Why is this project unhealthy?', 'unhealthy'],
    ['Show me recent deployment failures.', 'failures'],
  ])('%s → %s', (question, intent) => {
    expect(detectIntent(question, false)).toBe(intent);
  });
});
