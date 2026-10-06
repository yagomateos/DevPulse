import { chatRequestSchema, type ChatStreamEvent } from '@/schemas/ai';
import { streamChat } from '@/server/ai/chat';
import { requirePermission } from '@/server/auth/session';
import { parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

/**
 * Streams the assistant's answer as newline-delimited JSON events
 * (status → sources → text deltas → done). NDJSON keeps the client parser
 * trivial and lets us interleave citations and progress with tokens.
 */
export const POST = route(
  async (request) => {
    await requirePermission('ai:chat');
    const body = await parseBody(request, chatRequestSchema);
    const repo = await getRepository();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: ChatStreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        try {
          for await (const event of streamChat(repo, body, request.signal)) send(event);
        } catch (error) {
          if (!request.signal.aborted) {
            console.error('[ai/chat]', error);
            send({ type: 'error', message: 'The assistant could not complete this answer. Please retry.' });
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' },
    });
  },
  { simulate: false },
);
