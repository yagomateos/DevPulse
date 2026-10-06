import { describe, expect, it } from 'vitest';
import { can, PERMISSIONS, permissionsFor } from './permissions';

describe('RBAC permissions', () => {
  it('grants admins every permission', () => {
    for (const p of PERMISSIONS) expect(can('ADMIN', p)).toBe(true);
  });

  it('lets managers invite but not change roles or remove members', () => {
    expect(can('MANAGER', 'team:invite')).toBe(true);
    expect(can('MANAGER', 'team:change-role')).toBe(false);
    expect(can('MANAGER', 'team:remove')).toBe(false);
    expect(can('MANAGER', 'settings:workspace')).toBe(false);
  });

  it('keeps developers to incident and AI work', () => {
    expect(permissionsFor('DEVELOPER')).toEqual(['incident:create', 'incident:update', 'ai:analyze', 'ai:chat']);
    expect(can('DEVELOPER', 'project:create')).toBe(false);
  });

  it('denies everything without a role', () => {
    expect(can(null, 'ai:chat')).toBe(false);
    expect(can(undefined, 'incident:create')).toBe(false);
  });
});
