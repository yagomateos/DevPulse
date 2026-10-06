'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { SESSION_EXPIRED_EVENT } from '@/lib/http';
import { useSession } from './session-provider';

/**
 * Handles session expiry in one place: either the token's `exp` passes while
 * the tab is open, or any API call returns 401. Both end in a redirect to
 * /login that preserves the current location.
 */
export function SessionWatcher() {
  const { expiresAt } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const handled = useRef(false);

  useEffect(() => {
    handled.current = false;
    const expire = () => {
      if (handled.current) return;
      handled.current = true;
      queryClient.clear();
      toast.warning('Your session has expired', { description: 'Sign in again to continue where you left off.' });
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?reason=expired&next=${encodeURIComponent(next)}`);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    const timer = window.setTimeout(expire, Math.max(0, expiresAt - Date.now()));
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
      window.clearTimeout(timer);
    };
  }, [expiresAt, queryClient, router, pathname]);

  return null;
}
