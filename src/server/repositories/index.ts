import 'server-only';
import { createMemoryRepository } from './memory-repository';
import type { Repository } from './types';

export type { Invitation, Repository } from './types';

let repository: Repository | undefined;

/**
 * Resolves the configured data source. Defaults to the in-memory demo store so
 * the app runs with zero external services; DATA_SOURCE=postgres switches to
 * the Drizzle implementation (loaded lazily so the demo never needs a DB driver).
 */
export async function getRepository(): Promise<Repository> {
  if (repository) return repository;
  if (process.env.DATA_SOURCE === 'postgres') {
    const { createPostgresRepository } = await import('./postgres-repository');
    repository = createPostgresRepository();
  } else {
    repository = createMemoryRepository();
  }
  return repository;
}
