import { AuthenticatedRequest } from "./auth";

export function canAccessResource(userId: string, resourceOwnerId: string, isAdmin: boolean): boolean {
  return isAdmin || userId === resourceOwnerId;
}

export function getPermissions(role: "ADMIN" | "USER") {
  const base = {
    canViewOwnResources: true,
    canCreateResources: true,
    canUpdateOwnResources: true,
    canDeleteOwnResources: true,
  };

  if (role === "ADMIN") {
    return {
      ...base,
      canViewAllResources: true,
      canUpdateAllResources: true,
      canDeleteAllResources: true,
      canManageUsers: true,
    };
  }

  return base;
}

export function hasPermission(user: AuthenticatedRequest["user"], permission: string): boolean {
  const permissions = getPermissions(user.role);
  return (permissions as any)[permission] === true;
}
