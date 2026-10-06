'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Shell layout state. Only the user's sidebar preference is persisted. */
interface UIState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
    }),
    { name: 'aiw-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }), skipHydration: true },
  ),
);
