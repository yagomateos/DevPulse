'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { formatDateTime, type DatePreset } from '@/lib/format';

interface WorkspacePreferences {
  timeZone: string;
  demoMode: boolean;
}

const PreferencesContext = createContext<WorkspacePreferences>({ timeZone: 'UTC', demoMode: true });

/**
 * Workspace-wide preferences resolved on the server (layout) and shared with
 * client components. Static per request, so context is the right tool.
 */
export function WorkspacePreferencesProvider({ value, children }: { value: WorkspacePreferences; children: ReactNode }) {
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useWorkspacePreferences() {
  return useContext(PreferencesContext);
}

/** Date formatter bound to the workspace time zone (Settings → General). */
export function useDateFormatter() {
  const { timeZone } = useContext(PreferencesContext);
  return useCallback((value: string | Date | null | undefined, preset: DatePreset = 'datetime') => formatDateTime(value, preset, timeZone), [timeZone]);
}
