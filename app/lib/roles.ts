/**
 * User role types and utilities
 */

export type UserRole = 'user' | 'staff' | 'admin';

/**
 * Check if a role has permission for a given action
 */
export const rolePermissions: Record<UserRole, {
  canViewClasses: boolean;
  canJoinClasses: boolean;
  canManageClasses: boolean;
  canDeleteUsers: boolean;
}> = {
  user: {
    canViewClasses: true,
    canJoinClasses: true,
    canManageClasses: false,
    canDeleteUsers: false,
  },
  staff: {
    canViewClasses: true,
    canJoinClasses: true,
    canManageClasses: true,
    canDeleteUsers: false,
  },
  admin: {
    canViewClasses: true,
    canJoinClasses: true,
    canManageClasses: true,
    canDeleteUsers: true,
  },
};

/**
 * Check if a user with given role can perform an action
 */
export function canUserPerformAction(role: UserRole | null | undefined, action: keyof typeof rolePermissions['user']): boolean {
  if (!role || !rolePermissions[role]) {
    return false;
  }
  return rolePermissions[role][action];
}

/**
 * Get role from user metadata
 */
export function extractRoleFromMetadata(metadata: Record<string, any> | null | undefined): UserRole {
  if (!metadata) return 'user';
  
  const role = metadata.role || metadata.user_role;
  if (role === 'staff' || role === 'admin') {
    return role as UserRole;
  }
  return 'user';
}
