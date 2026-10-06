import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type z } from 'zod';
import { getRepository } from './repositories';
import { HttpError } from './auth/session';

export interface ApiErrorBody {
  error: { message: string; status: number; issues?: { path: string; message: string }[] };
}

const LATENCY_MS = { instant: [0, 0], realistic: [180, 650], slow: [1200, 2400] } as const;

/**
 * Emulates a real network so the UI's loading, error and retry states are
 * observable. Configured per workspace in Settings → General → Demo network.
 * Disabled in tests via MOCK_NETWORK=off.
 */
async function simulateNetwork(request: NextRequest) {
  if (process.env.MOCK_NETWORK === 'off' || request.headers.get('x-mock-network') === 'off') return;
  const { general } = await (await getRepository()).settings.get();
  const [min, max] = LATENCY_MS[general.network.latency];
  if (max > 0) await new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
  const forceFail = request.nextUrl.searchParams.get('__fail') === '1';
  if (forceFail || (request.method === 'GET' && Math.random() < Number(general.network.failureRate))) {
    throw new HttpError(503, 'The service is temporarily unavailable (simulated). Try again.');
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json<ApiErrorBody>({ error: { message: error.message, status: error.status } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          message: 'Validation failed',
          status: 422,
          issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
      },
      { status: 422 },
    );
  }
  console.error('[api] unhandled error', error);
  return NextResponse.json<ApiErrorBody>({ error: { message: 'Something went wrong on our side.', status: 500 } }, { status: 500 });
}

type Handler<Ctx> = (request: NextRequest, context: Ctx) => Promise<Response>;

/** Wraps a route handler with network simulation and uniform error mapping. */
export function route<Ctx = unknown>(handler: Handler<Ctx>, options: { simulate?: boolean } = {}): Handler<Ctx> {
  return async (request, context) => {
    try {
      if (options.simulate !== false) await simulateNetwork(request);
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function parseSearchParams<S extends z.ZodType>(request: NextRequest, schema: S): z.infer<S> {
  return schema.parse(Object.fromEntries(request.nextUrl.searchParams));
}

export async function parseBody<S extends z.ZodType>(request: NextRequest, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON');
  }
  return schema.parse(body);
}

export function notFound(entity: string): never {
  throw new HttpError(404, `${entity} not found`);
}

export function parseNumberParam(value: string, entity: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) notFound(entity);
  return n;
}
