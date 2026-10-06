import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useChat } from './use-chat';

function ndjson(events: object[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(c) {
        events.forEach((e) => c.enqueue(encoder.encode(`${JSON.stringify(e)}\n`)));
        c.close();
      },
    }),
    { headers: { 'Content-Type': 'application/x-ndjson' } },
  );
}

const context = { type: 'workspace' as const, id: null, label: 'Workspace' };

describe('useChat', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('streams status, sources and text into a single assistant message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ndjson([
      { type: 'status', message: 'Checking incidents…' },
      { type: 'sources', sources: [{ type: 'incident', id: 'inc-42', label: 'INC-42', href: '/x' }] },
      { type: 'text', delta: 'Deployment ' },
      { type: 'text', delta: '#128.' },
      { type: 'done', model: 'demo' },
    ])));
    const { result } = renderHook(() => useChat(context));
    act(() => result.current.send('Which deployment caused the latest incident?'));
    await waitFor(() => expect(result.current.messages.at(-1)?.status).toBe('done'));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({ role: 'assistant', content: 'Deployment #128.', model: 'demo', sources: [{ id: 'inc-42' }] });
  });

  it('surfaces errors and retries the last user turn', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Overloaded' } }), { status: 503 }))
      .mockResolvedValueOnce(ndjson([{ type: 'text', delta: 'Recovered' }, { type: 'done', model: 'demo' }]));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useChat(context));
    act(() => result.current.send('hello'));
    await waitFor(() => expect(result.current.messages.at(-1)).toMatchObject({ status: 'error', error: 'Overloaded' }));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.messages.at(-1)).toMatchObject({ status: 'done', content: 'Recovered' }));
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(1);
    const body = JSON.parse(String(fetchMock.mock.calls[1]![1].body));
    expect(body.messages).toEqual([{ role: 'user', content: 'hello' }]);
  });
});
