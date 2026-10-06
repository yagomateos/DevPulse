'use client';

import { create } from 'zustand';

type Mode = 'commands' | 'search';

interface CommandPaletteState {
  open: boolean;
  mode: Mode;
  show: (mode?: Mode) => void;
  hide: () => void;
  setOpen: (open: boolean) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  mode: 'commands',
  show: (mode = 'commands') => set({ open: true, mode }),
  hide: () => set({ open: false }),
  setOpen: (open) => set({ open }),
}));
