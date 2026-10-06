import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionProvider } from '@/features/auth/components/session-provider';
import type { Role, User } from '@/types/domain';

export function makeUser(role: Role = 'ADMIN'): User {
  return { id: 'usr_alex', name: 'Alex Chen', email: 'demo@example.com', role, title: 'Staff Engineer' };
}

export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity, refetchOnWindowFocus: false }, mutations: { retry: false } } });
}

/** Renders with the same providers as the app (query client, session, tooltips). */
export function renderWithProviders(ui: ReactElement, { role = 'ADMIN', queryClient = createTestQueryClient(), ...options }: RenderOptions & { role?: Role; queryClient?: QueryClient } = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SessionProvider user={makeUser(role)} expiresAt={Date.now() + 3_600_000}>
          <TooltipProvider>{children}</TooltipProvider>
        </SessionProvider>
      </QueryClientProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** JSON Response helper for mocking fetch. */
export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
