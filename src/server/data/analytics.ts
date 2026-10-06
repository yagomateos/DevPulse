import type {
  DashboardMetrics,
  DateRange,
  DeploymentSeriesPoint,
  Environment,
  MetricValue,
  PerformanceSeriesPoint,
  Project,
} from '@/types/domain';
import { createRandom } from './random';
import type { Dataset } from './dataset';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const RANGE_BUCKETS: Record<DateRange, { buckets: number; size: number }> = {
  '24h': { buckets: 24, size: HOUR },
  '7d': { buckets: 7, size: DAY },
  '30d': { buckets: 30, size: DAY },
  '90d': { buckets: 90, size: DAY },
};

export interface AnalyticsFilter {
  range: DateRange;
  projectId?: string;
  environment?: Environment;
}

interface Bucket {
  start: number;
  success: number;
  failed: number;
  p95: number;
  errorRate: number;
}

/**
 * Synthetic, deterministic time series per project. Seeded by project id so
 * charts are stable, and scaled by project traffic/health so filters produce
 * visibly different (but plausible) results.
 */
function projectSeries(project: Project, filter: AnalyticsFilter, now: number, periods = 2): Bucket[] {
  const { buckets, size } = RANGE_BUCKETS[filter.range];
  const seed = [...`${project.id}:${filter.range}:${filter.environment ?? 'all'}`].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const random = createRandom(seed);
  const activity = project.status === 'active' ? 1 : project.status === 'paused' ? 0.3 : 0.05;
  const envFactor = filter.environment === 'production' ? 0.35 : filter.environment === 'staging' ? 0.45 : filter.environment === 'preview' ? 0.2 : 1;
  const unhealthy = (100 - project.healthScore) / 100;
  const perBucket = (size === HOUR ? 0.6 : 5) * activity * envFactor;

  const total = buckets * periods;
  const end = Math.floor(now / size) * size;
  return Array.from({ length: total }, (_, i) => {
    const start = end - (total - 1 - i) * size;
    const isRecent = i >= total - Math.ceil(buckets / 4);
    const deploys = Math.max(0, Math.round(perBucket * (0.5 + random.next())));
    const failureProbability = 0.04 + unhealthy * (isRecent ? 0.6 : 0.25);
    let failed = 0;
    for (let d = 0; d < deploys; d++) if (random.chance(failureProbability)) failed++;
    const p95 = 140 + unhealthy * 260 * (isRecent ? 1.6 : 1) + random.int(-15, 25);
    const errorRate = 0.3 + unhealthy * 2.2 * (isRecent ? 1.5 : 1) + random.float(-0.1, 0.2);
    return { start, success: deploys - failed, failed, p95, errorRate };
  });
}

function aggregate(dataset: Dataset, filter: AnalyticsFilter, now: number) {
  const projects = dataset.projects.filter((p) => !filter.projectId || p.id === filter.projectId);
  const all = projects.map((p) => projectSeries(p, filter, now));
  const length = all[0]?.length ?? 0;
  const merged: Bucket[] = Array.from({ length }, (_, i) => {
    const cells = all.map((s) => s[i]!);
    const weight = cells.length || 1;
    return {
      start: cells[0]?.start ?? now,
      success: cells.reduce((a, c) => a + c.success, 0),
      failed: cells.reduce((a, c) => a + c.failed, 0),
      p95: Math.round(cells.reduce((a, c) => a + c.p95, 0) / weight),
      errorRate: Number((cells.reduce((a, c) => a + c.errorRate, 0) / weight).toFixed(2)),
    };
  });
  const half = Math.floor(length / 2);
  return { projects, previous: merged.slice(0, half), current: merged.slice(half) };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
const round = (n: number, digits = 1) => Number(n.toFixed(digits));

function metric(value: number, previous: number, sparkline: number[], digits = 1): MetricValue {
  return { value: round(value, digits), delta: round(value - previous, digits), sparkline: sparkline.map((v) => round(v, 2)) };
}

export function computeDashboardMetrics(dataset: Dataset, filter: AnalyticsFilter, now = Date.now()): DashboardMetrics {
  const { projects, previous, current } = aggregate(dataset, filter, now);
  const projectIds = new Set(projects.map((p) => p.id));

  const deploysNow = sum(current.map((b) => b.success + b.failed));
  const deploysPrev = sum(previous.map((b) => b.success + b.failed));
  const successRate = (buckets: Bucket[]) => {
    const total = sum(buckets.map((b) => b.success + b.failed));
    return total ? (sum(buckets.map((b) => b.success)) / total) * 100 : 100;
  };

  const openPrs = dataset.pullRequests.filter((p) => projectIds.has(p.projectId) && (p.status === 'open' || p.status === 'draft')).length;
  const activeIncidents = dataset.incidents.filter((i) => projectIds.has(i.projectId) && i.status !== 'resolved').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const health = avg(projects.map((p) => p.healthScore));

  return {
    range: filter.range,
    activeProjects: metric(activeProjects, activeProjects, projects.map((p) => p.healthScore), 0),
    openPullRequests: metric(openPrs, openPrs + 2, current.map((b) => b.success), 0),
    deployments: metric(deploysNow, deploysPrev, current.map((b) => b.success + b.failed), 0),
    activeIncidents: metric(activeIncidents, Math.max(0, activeIncidents - 1), current.map((b) => b.failed), 0),
    deploymentSuccessRate: metric(successRate(current), successRate(previous), current.map((b) => (b.success + b.failed ? (b.success / (b.success + b.failed)) * 100 : 100))),
    errorRate: metric(avg(current.map((b) => b.errorRate)), avg(previous.map((b) => b.errorRate)), current.map((b) => b.errorRate), 2),
    engineeringHealth: metric(health, health + 3, current.map((b) => 100 - b.errorRate * 8), 0),
  };
}

export function computeDeploymentSeries(dataset: Dataset, filter: AnalyticsFilter, now = Date.now()): DeploymentSeriesPoint[] {
  return aggregate(dataset, filter, now).current.map((b) => ({
    bucket: new Date(b.start).toISOString(),
    success: b.success,
    failed: b.failed,
  }));
}

export function computePerformanceSeries(dataset: Dataset, filter: AnalyticsFilter, now = Date.now()): PerformanceSeriesPoint[] {
  return aggregate(dataset, filter, now).current.map((b) => ({
    bucket: new Date(b.start).toISOString(),
    p95LatencyMs: b.p95,
    errorRate: b.errorRate,
  }));
}
