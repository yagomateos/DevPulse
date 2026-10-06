import type { Role } from '@/types/domain';

/**
 * Single source of truth for RBAC. Used by <PermissionGate /> / usePermissions()
 * to hide UI and by route handlers / server actions to enforce access.
 */
export const PERMISSIONS = [
  'project:create',
  'project:update',
  'incident:create',
  'incident:update',
  'team:invite',
  'team:change-role',
  'team:remove',
  'settings:workspace',
  'settings:ai',
  'ai:analyze',
  'ai:chat',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  MANAGER: [
    'project:create',
    'project:update',
    'incident:create',
    'incident:update',
    'team:invite',
    'settings:ai',
    'ai:analyze',
    'ai:chat',
  ],
  DEVELOPER: ['incident:create', 'incident:update', 'ai:analyze', 'ai:chat'],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Full access, including workspace settings and member management.',
  MANAGER: 'Manage projects, incidents and invitations. Cannot change roles or remove members.',
  DEVELOPER: 'Work with PRs, deployments and incidents. Read-only for projects and team.',
};
