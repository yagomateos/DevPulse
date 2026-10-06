import { queryOptions } from '@tanstack/react-query';
import { apiFetch, ApiError, jsonBody, SESSION_EXPIRED_EVENT } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import type { AIAnalysisEnvelope, AIAnalysisKind, ChatRequest, ChatStreamEvent } from '@/schemas/ai';

export interface AnalysisTarget<K extends AIAnalysisKind = AIAnalysisKind> {
  kind: K;
  projectId: string;
  key: string;
}

export const aiService = {
  status: () => apiFetch<{ live: boolean; model: string }>('/api/ai/status'),
  latest: <K extends AIAnalysisKind>(t: AnalysisTarget<K>) => apiFetch<AIAnalysisEnvelope<K> | null>('/api/ai/analyze', { query: { ...t } }),
  analyze: <K extends AIAnalysisKind>(t: AnalysisTarget<K>) => apiFetch<AIAnalysisEnvelope<K>>('/api/ai/analyze', { method: 'POST', body: jsonBody(t) }),

  /** POSTs a chat request and yields parsed NDJSON events as they arrive. */
  async *chat(request: ChatRequest, signal?: AbortSignal): AsyncGenerator<ChatStreamEvent> {
    const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal });
    if (!response.ok || !response.body) {
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (response.status === 401) window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      throw new ApiError(response.status, payload?.error?.message ?? 'The assistant is unavailable');
    }
    yield* parseNdjson(response.body);
  },
};

export async function* parseNdjson(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: !done });
    let newline = buffer.indexOf('\n');
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as ChatStreamEvent;
      newline = buffer.indexOf('\n');
    }
    if (done) break;
  }
  if (buffer.trim()) yield JSON.parse(buffer) as ChatStreamEvent;
}

export const aiQueries = {
  status: () => queryOptions({ queryKey: queryKeys.ai.status, queryFn: aiService.status, staleTime: Infinity }),
  latest: <K extends AIAnalysisKind>(t: AnalysisTarget<K>) =>
    queryOptions({ queryKey: queryKeys.ai.analysis(t.kind, t.projectId, t.key), queryFn: () => aiService.latest(t), staleTime: Infinity }),
};
