'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SidebarState = 'expanded' | 'collapsed';

interface UIState {
  sidebarState: SidebarState;
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarState: 'expanded',
      mobileSidebarOpen: false,
      toggleSidebar: () =>
        set((state) => ({
          sidebarState:
            state.sidebarState === 'expanded' ? 'collapsed' : 'expanded',
        })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ sidebarState: state.sidebarState }),
    }
  )
);
