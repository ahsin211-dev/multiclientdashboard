import { WorkspaceRole } from "@prisma/client";

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  ANALYST: 2,
  VIEWER: 1,
};

export function hasMinimumRole(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageClients(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, WorkspaceRole.ADMIN);
}

export function canRunSync(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, WorkspaceRole.ANALYST);
}

export function canEditSettings(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, WorkspaceRole.ADMIN);
}

export function canManageTeam(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, WorkspaceRole.OWNER);
}
