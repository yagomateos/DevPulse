import 'server-only';
import type { z } from 'zod';
import {
  deploymentAnalysisSchema,
  incidentAnalysisSchema,
  prAnalysisSchema,
  type AIAnalysisEnvelope,
  type AIAnalysisKind,
  type AIAnalysisResultMap,
} from '@/schemas/ai';
import type { Deployment, PullRequest } from '@/types/domain';
import { HttpError } from '../auth/session';
import type { Repository } from '../repositories';
import { DEMO_MODEL, getAIConfig } from './config';
import { analyzeDeploymentHeuristic, analyzePullRequestHeuristic, investigateIncidentHeuristic } from './heuristics';
import { toStrictJsonSchema } from './json-schema';
import { complete } from './openai-client';
import { describeDeployment, describeIncident, describePullRequest } from './prompts';

const SCHEMAS: { [K in AIAnalysisKind]: z.ZodType<AIAnalysisResultMap[K]> } = {
  pull_request: prAnalysisSchema,
  deployment: deploymentAnalysisSchema,
  incident: incidentAnalysisSchema,
};

const SYSTEM_PROMPTS: Record<AIAnalysisKind, string> = {
  pull_request:
    'You are a staff-level code reviewer for a React/Next.js and Go organisation. Review the pull request for security, performance, accessibility, type safety, testing and maintainability. Only report issues grounded in the provided diff, checks and comments. Reference exact file paths and new line numbers. Risk score: 0 (trivial) to 100 (must not merge).',
  deployment:
    'You are an SRE analysing a deployment. Use the pipeline stages, logs, test results, changed files and before/after metrics to determine risk and the most likely cause of any failure or regression. Cite concrete evidence.',
  incident:
    'You are an incident commander. Correlate the incident timeline with deployments, logs and code changes to determine the likely cause. Be explicit about confidence (0-1) and cite evidence with links when provided.',
};

interface Target {
  kind: AIAnalysisKind;
  projectId: string;
  /** PR/deployment number or incident id. */
  key: string;
}

/**
 * Settings → AI → "Include deployment logs": when off, logs are stripped
 * before anything reaches the model (live LLM or demo model).
 */
function withoutLogs(deployment: Deployment): Deployment {
  return { ...deployment, logs: [] };
}

async function loadSubject(repo: Repository, target: Target, includeLogs: boolean) {
  const scrub = (d: Deployment) => (includeLogs ? d : withoutLogs(d));
  if (target.kind === 'pull_request') {
    const pr = await repo.pullRequests.get(target.projectId, Number(target.key));
    if (!pr) throw new HttpError(404, 'Pull request not found');
    return { id: pr.id, prompt: describePullRequest(pr), heuristic: () => analyzePullRequestHeuristic(pr) };
  }
  if (target.kind === 'deployment') {
    const found = await repo.deployments.get(target.projectId, Number(target.key));
    if (!found) throw new HttpError(404, 'Deployment not found');
    const deployment = scrub(found);
    const pr = await relatedPullRequest(repo, deployment);
    return { id: deployment.id, prompt: describeDeployment(deployment, pr), heuristic: () => analyzeDeploymentHeuristic(deployment, pr) };
  }
  const incident = await repo.incidents.get(target.key);
  if (!incident || incident.projectId !== target.projectId) throw new HttpError(404, 'Incident not found');
  const related = incident.relatedDeploymentId ? await repo.deployments.getById(incident.relatedDeploymentId) : null;
  const deployment = related ? scrub(related) : null;
  const pr = deployment ? await relatedPullRequest(repo, deployment) : null;
  return { id: incident.id, prompt: describeIncident(incident, deployment, pr), heuristic: () => investigateIncidentHeuristic(incident, deployment, pr) };
}

async function relatedPullRequest(repo: Repository, deployment: Deployment): Promise<PullRequest | null> {
  if (!deployment.pullRequestId) return null;
  const number = Number(deployment.pullRequestId.split('#')[1]);
  return repo.pullRequests.get(deployment.projectId, number);
}

export async function runAnalysis<K extends AIAnalysisKind>(repo: Repository, target: Target & { kind: K }): Promise<AIAnalysisEnvelope<K>> {
  const settings = (await repo.settings.get()).ai;
  const config = getAIConfig(settings.model);
  const subject = await loadSubject(repo, target, settings.includeLogs);
  const schema = SCHEMAS[target.kind] as z.ZodType<AIAnalysisResultMap[K]>;

  let result: AIAnalysisResultMap[K];
  let model = DEMO_MODEL;

  if (config.live) {
    const message = await complete(config, {
      temperature: settings.temperature,
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPTS[target.kind]} Style: ${settings.responseStyle}.` },
        { role: 'user', content: subject.prompt },
      ],
      responseFormat: { name: `${target.kind}_analysis`, schema: toStrictJsonSchema(schema) },
    });
    const parsed = schema.safeParse(JSON.parse(message.content ?? '{}'));
    if (!parsed.success) throw new HttpError(502, 'The model returned an invalid analysis. Try again.');
    result = parsed.data;
    model = config.model;
  } else {
    // Simulated thinking time so the UI's progressive loading state is visible.
    await new Promise((r) => setTimeout(r, process.env.MOCK_NETWORK === 'off' ? 0 : 1400));
    result = schema.parse(subject.heuristic());
  }

  const envelope: AIAnalysisEnvelope<K> = {
    id: `ana_${Date.now().toString(36)}`,
    kind: target.kind,
    targetId: subject.id,
    model,
    createdAt: new Date().toISOString(),
    result,
  };
  await repo.aiAnalyses.save(envelope);
  return envelope;
}

