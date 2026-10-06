import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRepository, resetMemoryStore } from '../repositories/memory-repository';
import type * as Client from './client';
import { GitHubError, github, type GhPullRequest } from './client';
import { projectsForRepository, syncProject } from './sync';

vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<typeof Client>();
  return {
    ...actual,
    github: {
      pullRequest: vi.fn(),
      recentPullRequests: vi.fn(),
      files: vi.fn(async () => []),
      commits: vi.fn(async () => []),
      reviews: vi.fn(async () => []),
      reviewComments: vi.fn(async () => []),
      issueComments: vi.fn(async () => []),
      checkRuns: vi.fn(async () => []),
    },
  };
});

const gh = vi.mocked(github);

const remote = (number: number, updated_at = '2026-10-06T11:00:00Z'): GhPullRequest => ({
  number,
  title: `PR ${number}`,
  body: null,
  state: 'open',
  merged_at: null,
  created_at: '2026-10-06T10:00:00Z',
  updated_at,
  user: { login: 'yagomateos' },
  head: { ref: `feature-${number}`, sha: `sha${number}` },
  base: { ref: 'main' },
  labels: [],
  additions: 1,
  deletions: 0,
  changed_files: 1,
});

describe('syncProject', () => {
  beforeEach(() => {
    resetMemoryStore();
    vi.clearAllMocks();
  });

  async function setup() {
    const repo = createMemoryRepository();
    const project = await repo.projects.create({ name: 'XistraCloud', repository: 'yagomateos/XistraCloud', defaultBranch: 'main', language: 'TypeScript' }, 'usr_alex');
    return { repo, project };
  }

  it('upserts PRs, updates the open counter and skips unchanged ones on the next pass', async () => {
    const { repo, project } = await setup();
    gh.recentPullRequests.mockResolvedValue([remote(1), remote(2)]);
    gh.pullRequest.mockImplementation(async (_r, n) => remote(n));

    expect(await syncProject(repo, project)).toMatchObject({ synced: 2, skipped: 0, failed: 0 });
    expect((await repo.projects.get(project.id))?.openPullRequests).toBe(2);
    expect(await repo.pullRequests.get(project.id, 1)).toMatchObject({ id: `${project.id}#1`, title: 'PR 1' });

    gh.recentPullRequests.mockResolvedValue([remote(1), remote(2, '2026-10-06T12:00:00Z')]);
    expect(await syncProject(repo, project)).toMatchObject({ synced: 1, skipped: 1 });
    expect(await syncProject(repo, project, { force: true })).toMatchObject({ synced: 2, skipped: 0 });
    expect((await repo.pullRequests.list({ projectId: project.id, page: 1, pageSize: 50, status: [], risk: [] })).total).toBe(2);
  });

  it('reports per-PR failures without aborting the pass', async () => {
    const { repo, project } = await setup();
    gh.recentPullRequests.mockResolvedValue([remote(1), remote(2)]);
    gh.pullRequest.mockImplementation(async (_r, n) => {
      if (n === 2) throw new GitHubError(500, 'boom');
      return remote(n);
    });
    expect(await syncProject(repo, project)).toMatchObject({ synced: 1, failed: 1, error: 'boom' });
  });

  it('surfaces repository-level errors (e.g. private repo without token)', async () => {
    const { repo, project } = await setup();
    gh.recentPullRequests.mockRejectedValue(new GitHubError(404, 'GitHub 404: Not Found'));
    expect(await syncProject(repo, project)).toMatchObject({ synced: 0, failed: 1, error: 'GitHub 404: Not Found' });
  });

  it('matches projects to repositories case-insensitively', async () => {
    const { repo, project } = await setup();
    expect((await projectsForRepository(repo, 'YAGOMATEOS/xistracloud')).map((p) => p.id)).toEqual([project.id]);
  });
});
