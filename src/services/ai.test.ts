import { describe, expect, it } from 'vitest';
import type { ChatStreamEvent } from '@/schemas/ai';
import { parseNdjson } from './ai';

function streamOf(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
}

describe('parseNdjson', () => {
  it('reassembles events split across network chunks', async () => {
    const events: ChatStreamEvent[] = [];
    for await (const e of parseNdjson(streamOf(['{"type":"status","mess', 'age":"Thinking"}\n{"type":"text","delta":"Hel', 'lo"}\n{"type":"done","model":"m"}']))) events.push(e);
    expect(events).toEqual([
      { type: 'status', message: 'Thinking' },
      { type: 'text', delta: 'Hello' },
      { type: 'done', model: 'm' },
    ]);
  });
});
