'use client';

import type { ReactNode } from 'react';
import type { Permission } from '@/lib/permissions';
import { usePermissions } from '../hooks/use-permissions';

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  /** Rendered when the permission is missing (default: nothing). */
  fallback?: ReactNode;
}

/**
 * Hides UI the current role cannot use. This is a UX affordance only —
 * every guarded action is re-checked by the server.
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { can } = usePermissions();
  return <>{can(permission) ? children : fallback}</>;
}
