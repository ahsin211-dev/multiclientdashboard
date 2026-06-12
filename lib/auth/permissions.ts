import type { WorkspaceRole } from "@prisma/client";

const rank: Record<WorkspaceRole, number> = {
  VIEWER: 0,
  ANALYST: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function canManageWorkspace(role: WorkspaceRole) {
  return rank[role] >= rank.ADMIN;
}

export function canAnalyze(role: WorkspaceRole) {
  return rank[role] >= rank.ANALYST;
}

export function canView(role: WorkspaceRole) {
  return rank[role] >= rank.VIEWER;
}
