'use client';

import type { VisibilityState } from '@tanstack/react-table';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Per-table UI preferences (column visibility, density). Pure client state,
 * persisted to localStorage — never sent to the server.
 */
interface TablePreferencesState {
  visibility: Record<string, VisibilityState>;
  density: Record<string, 'comfortable' | 'compact'>;
  setVisibility: (tableId: string, visibility: VisibilityState) => void;
  setDensity: (tableId: string, density: 'comfortable' | 'compact') => void;
}

export const useTablePreferences = create<TablePreferencesState>()(
  persist(
    (set) => ({
      visibility: {},
      density: {},
      setVisibility: (tableId, visibility) => set((s) => ({ visibility: { ...s.visibility, [tableId]: visibility } })),
      setDensity: (tableId, density) => set((s) => ({ density: { ...s.density, [tableId]: density } })),
    }),
    // Rehydrated after mount (see Providers) so SSR and first client render match.
    { name: 'aiw-table-preferences', version: 1, skipHydration: true },
  ),
);
