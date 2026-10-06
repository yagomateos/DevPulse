'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '@/types/domain';

interface SessionContextValue {
  user: User;
  expiresAt: number;
  /** Updated when the session is re-issued (role switch, simulated expiry). */
  setExpiresAt: (value: number) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * The authenticated user is resolved on the server (workspace layout) and
 * handed to the client once. Context is the right tool here: it is static
 * per request, read in many places and never fetched by the client.
 */
export function SessionProvider({ user, expiresAt: initialExpiresAt, children }: { user: User; expiresAt: number; children: ReactNode }) {
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [lastServerExpiry, setLastServerExpiry] = useState(initialExpiresAt);
  // A server refresh (e.g. after switching role) re-issues the token.
  if (initialExpiresAt !== lastServerExpiry) {
    setLastServerExpiry(initialExpiresAt);
    setExpiresAt(initialExpiresAt);
  }
  return <SessionContext.Provider value={{ user, expiresAt, setExpiresAt }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
