'use client';

import { create } from 'zustand';

/**
 * Global dialogs that can be opened from anywhere (command palette, empty
 * states, page actions) without prop drilling. Rendered once in the shell.
 */
type DialogName = 'create-incident' | 'create-project' | 'invite-member';

interface DialogState {
  active: DialogName | null;
  /** Optional prefill, e.g. the current project for "Create incident". */
  payload: Record<string, string | null>;
  openDialog: (name: DialogName, payload?: Record<string, string | null>) => void;
  closeDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  active: null,
  payload: {},
  openDialog: (active, payload = {}) => set({ active, payload }),
  closeDialog: () => set({ active: null, payload: {} }),
}));
