'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getQueryClient } from '@/lib/query-client';
import { useTablePreferences } from '@/stores/table-preferences-store';
import { useUIStore } from '@/stores/ui-store';

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  // Persisted client stores hydrate after mount so SSR markup matches.
  useEffect(() => {
    void useUIStore.persist.rehydrate();
    void useTablePreferences.persist.rehydrate();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange storageKey="aiw-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
