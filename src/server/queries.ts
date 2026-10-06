import 'server-only';
import { cache } from 'react';
import { getRepository } from './repositories';

/**
 * Request-scoped (React `cache`) loaders. Layouts call them to validate that a
 * record exists *before* any loading boundary streams — so missing records
 * return a real HTTP 404 — and pages/metadata reuse the same result for free.
 */
export const getProject = cache(async (id: string) => (await getRepository()).projects.get(id));
export const getPullRequest = cache(async (projectId: string, number: number) => (Number.isInteger(number) ? (await getRepository()).pullRequests.get(projectId, number) : null));
export const getDeployment = cache(async (projectId: string, number: number) => (Number.isInteger(number) ? (await getRepository()).deployments.get(projectId, number) : null));
export const getIncident = cache(async (id: string) => (await getRepository()).incidents.get(id));
export const getSettings = cache(async () => (await getRepository()).settings.get());
