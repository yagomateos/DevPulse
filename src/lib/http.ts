/**
 * Typed fetch wrapper for the app's Route Handlers. Normalises errors into
 * ApiError so hooks and components can branch on `status` (401 → session
 * expired, 403 → forbidden, 422 → field errors…).
 */

export interface FieldIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly issues: FieldIssue[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

export const SESSION_EXPIRED_EVENT = 'aiw:session-expired';

type Query = Record<string, string | number | boolean | string[] | null | undefined>;

export function toSearchParams(query: Query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','));
    } else params.set(key, String(value));
  }
  return params;
}

export async function apiFetch<T>(path: string, init: RequestInit & { query?: Query } = {}): Promise<T> {
  const { query, headers, ...rest } = init;
  const qs = toSearchParams(query).toString();
  const response = await fetch(`${path}${qs ? `?${qs}` : ''}`, {
    ...rest,
    headers: { Accept: 'application/json', ...(rest.body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    credentials: 'same-origin',
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as { error?: { message?: string; issues?: FieldIssue[] } } | null;

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, payload?.error?.message ?? `Request failed (${response.status})`, payload?.error?.issues ?? []);
  }
  return payload as T;
}

export const jsonBody = (value: unknown) => JSON.stringify(value);
