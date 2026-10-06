import 'server-only';
import type { Project } from '@/types/domain';
import type { Repository } from '../repositories';
import { github, GitHubError, type GhPullRequest } from './client';
import { toPullRequest } from './mapper';

/**
 * Pull-request sync between GitHub and the repository layer. Every write is
 * an idempotent upsert keyed by `${projectId}#${number}`, so webhook retries,
 * the reconcile cron and manual syncs can overlap safely.
 */

/** How many recently-updated PRs a backfill / reconcile pass looks at. */
export const BACKFILL_LIMIT = 30;
const CONCURRENCY = 4;

export interface SyncResult {
  projectId: string;
  repository: string;
  synced: number;
  skipped: number;
  failed: number;
  error?: string;
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
  }));
}

/**
 * Fetches the full aggregate for one PR and upserts it. Always reads fresh
 * state from the API rather than trusting a webhook payload, which may be a
 * stale redelivery.
 */
export async function syncPullRequest(repo: Repository, project: Pick<Project, 'id' | 'repository'>, number: number) {
  const fullName = project.repository;
  const pr = await github.pullRequest(fullName, number);
  const [files, commits, reviews, reviewComments, issueComments, checkRuns] = await Promise.all([
    github.files(fullName, number),
    github.commits(fullName, number),
    github.reviews(fullName, number),
    github.reviewComments(fullName, number),
    github.issueComments(fullName, number),
    // Check runs need the Checks permission; a token without it shouldn't break the sync.
    github.checkRuns(fullName, pr.head.sha).catch((error: unknown) => {
      if (error instanceof GitHubError && (error.status === 403 || error.status === 404)) return [];
      throw error;
    }),
  ]);
  const mapped = toPullRequest(project.id, { pr, files, commits, reviews, reviewComments, issueComments, checkRuns });
  await repo.pullRequests.upsert(mapped);
  return mapped;
}

/**
 * Backfill / reconcile: lists the most recently updated PRs and re-syncs the
 * ones whose `updated_at` moved (or all of them with `force`).
 */
export async function syncProject(repo: Repository, project: Pick<Project, 'id' | 'repository'>, { force = false, limit = BACKFILL_LIMIT } = {}): Promise<SyncResult> {
  const result: SyncResult = { projectId: project.id, repository: project.repository, synced: 0, skipped: 0, failed: 0 };
  let recent: GhPullRequest[];
  try {
    recent = await github.recentPullRequests(project.repository, limit);
  } catch (error) {
    return { ...result, failed: 1, error: error instanceof Error ? error.message : String(error) };
  }

  await mapLimit(recent, CONCURRENCY, async (pr) => {
    try {
      const stored = force ? null : await repo.pullRequests.get(project.id, pr.number);
      if (stored && stored.updatedAt === pr.updated_at) {
        result.skipped++;
        return;
      }
      await syncPullRequest(repo, project, pr.number);
      result.synced++;
    } catch (error) {
      result.failed++;
      result.error ??= error instanceof Error ? error.message : String(error);
      console.error(`[github-sync] ${project.repository}#${pr.number} failed`, error);
    }
  });
  return result;
}

/** All projects linked to a GitHub repository (case-insensitive, as GitHub treats names). */
export async function projectsForRepository(repo: Repository, fullName: string) {
  const target = fullName.toLowerCase();
  return (await repo.projects.list()).filter((p) => p.repository.toLowerCase() === target);
}
