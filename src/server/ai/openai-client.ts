import 'server-only';
import type { AIConfig } from './config';

/**
 * Minimal client for any OpenAI-compatible Chat Completions endpoint
 * (OpenAI, Azure OpenAI, Ollama, vLLM, LM Studio, OpenRouter…).
 * Kept dependency-free so the transport is easy to audit and swap.
 */

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type LLMMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string };

export interface ToolDefinition {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

interface CompletionRequest {
  messages: LLMMessage[];
  temperature?: number;
  tools?: ToolDefinition[];
  responseFormat?: { name: string; schema: Record<string, unknown> };
  signal?: AbortSignal;
}

function body(config: AIConfig, req: CompletionRequest, stream: boolean) {
  return JSON.stringify({
    model: config.model,
    messages: req.messages,
    temperature: req.temperature ?? 0.2,
    stream,
    ...(req.tools?.length ? { tools: req.tools, tool_choice: 'auto' } : {}),
    ...(req.responseFormat
      ? { response_format: { type: 'json_schema', json_schema: { name: req.responseFormat.name, schema: req.responseFormat.schema, strict: true } } }
      : {}),
  });
}

async function post(config: AIConfig, req: CompletionRequest, stream: boolean) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: body(config, req, stream),
    signal: req.signal,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`LLM request failed (${response.status}): ${text.slice(0, 300)}`);
  }
  return response;
}

export async function complete(config: AIConfig, req: CompletionRequest) {
  const response = await post(config, req, false);
  const json = (await response.json()) as {
    choices: { message: { content: string | null; tool_calls?: ToolCall[] } }[];
  };
  const message = json.choices[0]?.message;
  if (!message) throw new Error('LLM returned no choices');
  return message;
}

/** Streams text deltas from an SSE chat completion. */
export async function* streamText(config: AIConfig, req: CompletionRequest): AsyncGenerator<string> {
  const response = await post(config, req, true);
  if (!response.body) throw new Error('LLM response has no body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const delta = (JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Ignore keep-alive / partial frames.
      }
    }
  }
}
