import 'server-only';
import type { ChatRequest, ChatStreamEvent, SourceRef } from '@/schemas/ai';
import type { Repository } from '../repositories';
import { DEMO_MODEL, getAIConfig } from './config';
import { complete, streamText, type LLMMessage } from './openai-client';
import { describeContext, TOOL_DEFINITIONS, TOOL_STATUS, TOOLS, type ToolResult } from './tools';

const SYSTEM_PROMPT = `You are the AI assistant inside "AI Engineering Workspace", a tool for software teams.
Answer questions about projects, pull requests, deployments and incidents using ONLY data returned by tools or the provided context.
Format answers in GitHub-flavoured markdown: short paragraphs, bullet lists, **bold** key facts. Reference entities by number (PR #312, Deployment #128, INC-42).
If the data does not answer the question, say so and suggest what to check next. Never invent numbers.`;

function dedupe(sources: SourceRef[]) {
  const seen = new Set<string>();
  return sources.filter((s) => (seen.has(s.href) ? false : (seen.add(s.href), true)));
}

export async function* streamChat(repo: Repository, request: ChatRequest, signal?: AbortSignal): AsyncGenerator<ChatStreamEvent> {
  const settings = (await repo.settings.get()).ai;
  const config = getAIConfig(settings.model);
  const context = await describeContext(repo, request.context);

  if (!config.live) {
    yield* demoChat(repo, request, context, signal);
    return;
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\nStyle: ${settings.responseStyle}.\nContext: ${context.text}` },
    ...request.messages.map((m) => ({ role: m.role, content: m.content }) as LLMMessage),
  ];
  const sources: SourceRef[] = context.source ? [context.source] : [];

  // Tool-calling phase (bounded), then a streamed final answer.
  for (let step = 0; step < 3; step++) {
    const message = await complete(config, { messages, tools: TOOL_DEFINITIONS, temperature: settings.temperature, signal });
    if (!message.tool_calls?.length) {
      if (message.content) {
        if (sources.length) yield { type: 'sources', sources: dedupe(sources) };
        // Re-chunk the already complete answer so the client renders it progressively.
        for (const chunk of message.content.match(/.{1,24}(\s|$)/gs) ?? [message.content]) yield { type: 'text', delta: chunk };
        yield { type: 'done', model: config.model };
        return;
      }
      break;
    }
    messages.push({ role: 'assistant', content: message.content, tool_calls: message.tool_calls });
    for (const call of message.tool_calls) {
      const tool = TOOLS[call.function.name];
      yield { type: 'status', message: TOOL_STATUS[call.function.name] ?? 'Gathering data…' };
      let result: ToolResult = { data: { error: 'Unknown tool' }, sources: [] };
      if (tool) {
        try {
          result = await tool.run(repo, JSON.parse(call.function.arguments || '{}') as Record<string, unknown>);
        } catch {
          result = { data: { error: 'Tool failed' }, sources: [] };
        }
      }
      sources.push(...result.sources);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result.data) });
    }
  }

  if (sources.length) yield { type: 'sources', sources: dedupe(sources).slice(0, 6) };
  for await (const delta of streamText(config, { messages, temperature: settings.temperature, signal })) {
    yield { type: 'text', delta };
  }
  yield { type: 'done', model: config.model };
}

/* -------------------------------------------------------------------------- */
/* Demo model: intent detection → same tools → templated markdown             */
/* -------------------------------------------------------------------------- */

type Intent = 'incident-cause' | 'risky-prs' | 'what-changed' | 'unhealthy' | 'failures' | 'context' | 'overview';

export function detectIntent(question: string, hasContext: boolean): Intent {
  const q = question.toLowerCase();
  if (/(caus|why).*(incident|outage)|incident.*(caus|deploy)|which deployment/.test(q)) return 'incident-cause';
  if (/risk/.test(q)) return 'risky-prs';
  if (/(fail|broke|red)/.test(q) && /deploy/.test(q)) return 'failures';
  if (/(unhealthy|health|why is)/.test(q)) return 'unhealthy';
  if (/(changed|this week|recent|what happened|summary)/.test(q)) return 'what-changed';
  if (hasContext && /(this|explain|summari[sz]e|tell me|what)/.test(q)) return 'context';
  return 'overview';
}

async function* typewriter(text: string, signal?: AbortSignal): AsyncGenerator<ChatStreamEvent> {
  const delay = process.env.MOCK_NETWORK === 'off' ? 0 : 14;
  for (const token of text.match(/\S+\s*|\s+/g) ?? []) {
    if (signal?.aborted) return;
    if (delay) await new Promise((r) => setTimeout(r, delay));
    yield { type: 'text', delta: token };
  }
}

const relTime = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`;
  return `${Math.round(minutes / 1440)} d ago`;
};

async function* demoChat(repo: Repository, request: ChatRequest, context: Awaited<ReturnType<typeof describeContext>>, signal?: AbortSignal): AsyncGenerator<ChatStreamEvent> {
  const question = request.messages.at(-1)?.content ?? '';
  const intent = detectIntent(question, !!context.source);
  const projectId = request.context.type === 'workspace' ? undefined : context.projectId;
  const sources: SourceRef[] = [];
  const call = async function* (name: keyof typeof TOOLS, args: Record<string, unknown> = {}) {
    yield { type: 'status', message: TOOL_STATUS[name] ?? 'Gathering data…' } as ChatStreamEvent;
    if (process.env.MOCK_NETWORK !== 'off') await new Promise((r) => setTimeout(r, 450));
    const result = await TOOLS[name]!.run(repo, args);
    sources.push(...result.sources);
    return result.data;
  };

  let answer = '';

  switch (intent) {
    case 'incident-cause': {
      const incidents = (yield* call('list_incidents', { activeOnly: true, projectId })) as { id: string; ref: string; title: string; severity: string; relatedDeploymentId: string | null; projectId: string; createdAt: string }[];
      // Prefer the most recent active incident that is linked to a deployment.
      const latest = incidents.find((i) => i.relatedDeploymentId) ?? incidents[0];
      if (!latest) {
        answer = 'There are **no active incidents** right now. 🎉\n\nResolved incidents are still listed under each project’s *Incidents* tab.';
        break;
      }
      const deployment = latest.relatedDeploymentId ? await repo.deployments.getById(latest.relatedDeploymentId) : null;
      if (deployment) {
        sources.push({ type: 'deployment', id: deployment.id, label: `Deployment #${deployment.number} · ${deployment.environment}`, href: `/projects/${deployment.projectId}/deployments/${deployment.number}` });
        const minutes = Math.round((new Date(latest.createdAt).getTime() - new Date(deployment.startedAt).getTime()) / 60_000);
        const errors = deployment.logs.filter((l) => l.level === 'error').slice(0, 2);
        answer = `The latest incident, **${latest.ref} — ${latest.title}** (${latest.severity.toUpperCase()}), was most likely caused by **Deployment #${deployment.number}** to ${deployment.environment}.\n\n**Why I think so**\n- The deployment of \`${deployment.commitSha}\` started **${minutes} minutes** before the incident was opened.\n- Its status is **${deployment.status}**${deployment.tests.failed ? ` and it shipped with ${deployment.tests.failed} failing tests` : ''}.\n${errors.map((e) => `- Log \`${e.source}\`: “${e.message}”`).join('\n')}\n- p95 latency went from ${deployment.performance.before.p95LatencyMs}ms to ${deployment.performance.after?.p95LatencyMs ?? 'n/a'}ms.\n\n**Suggested next step:** open the deployment’s *Performance* tab and run **Analyze Deployment** for a structured root-cause report.`;
      } else {
        answer = `The latest incident is **${latest.ref} — ${latest.title}**. No deployment is linked to it, so the cause is likely environmental. Try **Investigate with AI** on the incident page.`;
      }
      break;
    }
    case 'risky-prs': {
      const prs = (yield* call('list_pull_requests', { openOnly: true, minRisk: 'medium', projectId })) as { number: number; title: string; author: string; riskScore: number; riskLevel: string; failedTests: number; status: string }[];
      answer = prs.length
        ? `Here are the riskiest **open** pull requests${projectId ? ' in this project' : ''}:\n\n${prs
            .map((p, i) => `${i + 1}. **#${p.number} — ${p.title}** (${p.author})\n   - Risk **${p.riskLevel}** · score ${p.riskScore}${p.failedTests ? ` · ${p.failedTests} failing tests` : ''}${p.status === 'draft' ? ' · draft' : ''}`)
            .join('\n')}\n\nOpen any of them and click **Analyze with AI** to get file-level findings.`
        : 'No open pull requests are rated medium risk or higher. 👍';
      break;
    }
    case 'failures': {
      const deployments = (yield* call('list_deployments', { status: 'failed', projectId })) as { number: number; projectId: string; environment: string; message: string; author: string; startedAt: string; failedTests: number }[];
      answer = deployments.length
        ? `**${deployments.length} failed deployment${deployments.length > 1 ? 's' : ''}** recently:\n\n${deployments
            .slice(0, 5)
            .map((d) => `- **#${d.number}** · ${d.projectId} · ${d.environment} · ${relTime(d.startedAt)} — “${d.message}” (${d.author})${d.failedTests ? ` · ${d.failedTests} failing tests` : ''}`)
            .join('\n')}\n\nThe most recent production failure is the most urgent; check whether it is linked to an open incident.`
        : 'No failed deployments in the selected scope.';
      break;
    }
    case 'unhealthy': {
      const projects = (yield* call('get_project_health', { projectId })) as { name: string; healthScore: number; deploymentStatus: string; activeIncidents: number; openPullRequests: number }[];
      const worst = projects[0];
      if (!worst) {
        answer = 'I could not find that project.';
        break;
      }
      const factors = [
        worst.activeIncidents ? `**${worst.activeIncidents} active incident${worst.activeIncidents > 1 ? 's' : ''}**` : null,
        worst.deploymentStatus === 'failed' ? 'the **latest deployment failed**' : null,
        worst.openPullRequests > 5 ? `${worst.openPullRequests} open PRs waiting for review` : null,
      ].filter(Boolean);
      answer = `**${worst.name}** has a health score of **${worst.healthScore}/100**.\n\n**Main contributors**\n${factors.length ? factors.map((f) => `- ${f}`).join('\n') : '- No major negative signals'}\n\n${projects.length > 1 ? `**Other projects**\n${projects.slice(1).map((p) => `- ${p.name}: ${p.healthScore}/100`).join('\n')}` : ''}`;
      break;
    }
    case 'what-changed': {
      const activity = (yield* call('get_recent_activity', { projectId, limit: 40 })) as { kind: string; title: string; description: string; occurredAt: string }[];
      const week = activity.filter((a) => Date.now() - new Date(a.occurredAt).getTime() < 7 * 86_400_000);
      const count = (kind: string) => week.filter((a) => a.kind === kind).length;
      answer = `**This week${projectId ? ' in this project' : ''}:**\n\n- **${count('pull_request')}** pull request updates\n- **${count('deployment')}** deployments\n- **${count('incident')}** incident events\n\n**Highlights**\n${week
        .slice(0, 6)
        .map((a) => `- ${a.title} — ${a.description} *(${relTime(a.occurredAt)})*`)
        .join('\n')}`;
      break;
    }
    case 'context': {
      if (context.source) sources.push(context.source);
      answer = `Here is what I know about **${context.source?.label}**:\n\n${context.text
        .split(/(?<=\.)\s+/)
        .map((s) => `- ${s}`)
        .join('\n')}\n\nAsk me about its risk, related incidents, or what to do next.`;
      break;
    }
    default: {
      const projects = (yield* call('get_project_health')) as { name: string; healthScore: number; activeIncidents: number }[];
      const incidents = projects.reduce((a, p) => a + p.activeIncidents, 0);
      answer = `I can answer questions about your projects, pull requests, deployments and incidents.\n\n**Right now:** ${incidents} active incident(s); the least healthy project is **${projects[0]?.name}** (${projects[0]?.healthScore}/100).\n\nTry asking:\n- *Which deployment caused the latest incident?*\n- *Which PRs are risky?*\n- *What changed this week?*`;
    }
  }

  if (sources.length) yield { type: 'sources', sources: dedupe(sources).slice(0, 6) };
  yield* typewriter(answer, signal);
  yield { type: 'done', model: DEMO_MODEL };
}
