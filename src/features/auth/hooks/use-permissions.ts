'use client';

import { useCallback } from 'react';
import { can, type Permission } from '@/lib/permissions';
import { useSession } from '../components/session-provider';

export function usePermissions() {
  const { user } = useSession();
  const check = useCallback((permission: Permission) => can(user.role, permission), [user.role]);
  return { role: user.role, can: check };
}
