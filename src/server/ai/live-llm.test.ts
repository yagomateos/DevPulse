// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatStreamEvent } from '@/schemas/ai';
import { createDataset } from '../data/dataset';
import { createMemoryRepository, resetMemoryStore } from '../repositories/memory-repository';
import { analyzePullRequestHeuristic } from './heuristics';
import { runAnalysis } from './analyze';
import { streamChat } from './chat';

/**
 * The live (OpenAI-compatible) path, exercised against a fake provider:
 * request shape, structured output validation, tool calling and SSE streaming.
 */

type Body = { model: string; stream: boolean; messages: { role: string; content: string | null; tool_call_id?: string }[]; tools?: unknown[]; response_format?: { json_schema: { strict: boolean; schema: object } } };

const sse = (chunks: string[]) =>
  new Response(chunks.map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`).join('') + 'data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
const completion = (message: object) => new Response(JSON.stringify({ choices: [{ message }] }), { headers: { 'Content-Type': 'application/json' } });

const requests: Body[] = [];
function fakeProvider(respond: (body: Body, index: number) => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe('https://llm.test/v1/chat/completions');
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
      const body = JSON.parse(String(init.body)) as Body;
      requests.push(body);
      return respond(body, requests.length - 1);
    }),
  );
}

beforeEach(() => {
  resetMemoryStore(Date.UTC(2026, 9, 5, 10));
  requests.length = 0;
  vi.stubEnv('AI_API_KEY', 'test-key');
  vi.stubEnv('AI_BASE_URL', 'https://llm.test/v1');
  vi.stubEnv('AI_MODEL', 'gpt-test');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('live structured analysis', () => {
  const pr = createDataset(Date.UTC(2026, 9, 5, 10)).pullRequests.find((p) => p.id === 'orion-gateway#312')!;

  it('sends a strict JSON schema with the PR context and stores the validated result', async () => {
    fakeProvider(() => completion({ content: JSON.stringify(analyzePullRequestHeuristic(pr)) }));
    const repo = createMemoryRepository();
    const envelope = await runAnalysis(repo, { kind: 'pull_request', projectId: 'orion-gateway', key: '312' });

    expect(envelope.model).toBe('gpt-test');
    expect(envelope.result.findings.length).toBeGreaterThan(0);
    const body = requests[0]!;
    expect(body.response_format?.json_schema.strict).toBe(true);
    expect(body.messages[1]!.content).toContain('internal/middleware/ratelimit.go');
    expect(await repo.aiAnalyses.latest('pull_request', 'orion-gateway#312')).toMatchObject({ model: 'gpt-test' });
  });

  it('rejects model output that does not match the schema (502)', async () => {
    fakeProvider(() => completion({ content: JSON.stringify({ riskScore: 'very high' }) }));
    await expect(runAnalysis(createMemoryRepository(), { kind: 'pull_request', projectId: 'orion-gateway', key: '312' })).rejects.toMatchObject({ status: 502 });
  });

  it('strips deployment logs from the prompt when the setting is off', async () => {
    const repo = createMemoryRepository();
    const settings = await repo.settings.get();
    await repo.settings.update('ai', { ...settings.ai, includeLogs: false });
    fakeProvider(() => completion({ content: JSON.stringify({ risk: 'high', possibleCause: 'x', evidence: [], affectedAreas: [], recommendedActions: [], confidence: 0.5 }) }));
    await runAnalysis(repo, { kind: 'deployment', projectId: 'orion-gateway', key: '128' });
    expect(requests[0]!.messages[1]!.content).not.toContain('statement timeout');
  });
});

describe('live chat with tool calling', () => {
  it('runs tools, cites their records and streams the final answer', async () => {
    fakeProvider((body, i) => {
      if (i === 0) {
        expect(body.tools?.length).toBeGreaterThan(0);
        return completion({ content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'list_incidents', arguments: '{"activeOnly":true}' } }] });
      }
      if (i === 1) {
        const toolMessage = body.messages.find((m) => m.role === 'tool');
        expect(toolMessage?.tool_call_id).toBe('call_1');
        expect(toolMessage?.content).toContain('inc-42');
        return completion({ content: null }); // no more tools → stream the answer
      }
      expect(body.stream).toBe(true);
      return sse(['Deployment ', '#128 ', 'caused INC-42.']);
    });

    const events: ChatStreamEvent[] = [];
    for await (const e of streamChat(createMemoryRepository(), { messages: [{ role: 'user', content: 'Which deployment caused the latest incident?' }], context: { type: 'workspace', id: null, label: 'Workspace' } })) events.push(e);

    expect(events.find((e) => e.type === 'status')).toMatchObject({ message: 'Checking incidents…' });
    expect(events.find((e) => e.type === 'sources')).toMatchObject({ sources: expect.arrayContaining([expect.objectContaining({ id: 'inc-42' })]) });
    expect(events.filter((e) => e.type === 'text').map((e) => (e as { delta: string }).delta).join('')).toBe('Deployment #128 caused INC-42.');
    expect(events.at(-1)).toEqual({ type: 'done', model: 'gpt-test' });
  });

  it('surfaces provider failures as errors', async () => {
    fakeProvider(() => new Response('upstream overloaded', { status: 529 }));
    const iterator = streamChat(createMemoryRepository(), { messages: [{ role: 'user', content: 'hi' }], context: { type: 'workspace', id: null, label: 'Workspace' } });
    await expect(iterator.next()).rejects.toThrow(/LLM request failed \(529\)/);
  });
});

describe('demo chat (no API key)', () => {
  it('answers grounded questions with citations', async () => {
    vi.stubEnv('AI_API_KEY', '');
    vi.stubEnv('OPENAI_API_KEY', '');
    const events: ChatStreamEvent[] = [];
    for await (const e of streamChat(createMemoryRepository(), { messages: [{ role: 'user', content: 'Which PRs are risky?' }], context: { type: 'workspace', id: null, label: 'Workspace' } })) events.push(e);
    const text = events.filter((e) => e.type === 'text').map((e) => (e as { delta: string }).delta).join('');
    expect(text).toMatch(/riskiest \*\*open\*\* pull requests/);
    expect(events.find((e) => e.type === 'sources')).toBeTruthy();
    expect(events.at(-1)).toEqual({ type: 'done', model: 'demo-heuristic-v1' });
  });
});
