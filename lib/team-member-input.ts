import type { UserRole } from "@prisma/client";

export const teamRoles = ["OWNER", "ADMIN", "MANAGER", "AGENT"] as const;
export const teamStatuses = ["ACTIVE", "INACTIVE"] as const;

export type TeamStatus = (typeof teamStatuses)[number];

export function isValidTeamRole(value: unknown): value is UserRole {
  return typeof value === "string" && teamRoles.includes(value as UserRole);
}

export function normalizeTeamRole(value: unknown): UserRole {
  return isValidTeamRole(value) ? value : "AGENT";
}

export function normalizeTeamStatus(value: unknown): TeamStatus {
  if (typeof value === "boolean") return value ? "ACTIVE" : "INACTIVE";
  return String(value).toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

export function getTeamRoleLabel(value: unknown) {
  const role = normalizeTeamRole(value);
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "AGENT":
    default:
      return "Agent";
  }
}

export function canChangeOwnerSafely({
  currentOwnersCount,
  currentRole,
  nextRole,
  nextStatus
}: {
  currentOwnersCount: number;
  currentRole: UserRole;
  nextRole: UserRole;
  nextStatus: TeamStatus;
}) {
  const affectsOwner = currentRole === "OWNER" && (nextRole !== "OWNER" || nextStatus === "INACTIVE");

  return {
    safe: !affectsOwner || currentOwnersCount > 1,
    message: "At least one active owner must remain in this workspace."
  };
}
