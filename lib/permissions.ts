import type { UserRole } from "@prisma/client";

export const appRoles = ["OWNER", "ADMIN", "MANAGER", "AGENT", "VIEWER"] as const;

export type RoleName = UserRole | "VIEWER";

export type Permission =
  | "dashboard.view"
  | "contacts.view"
  | "contacts.manage"
  | "inbox.manage"
  | "messages.send"
  | "messages.viewLogs"
  | "autoReply.view"
  | "autoReply.manage"
  | "campaign.view"
  | "campaign.manage"
  | "settings.view"
  | "settings.manage"
  | "team.view"
  | "team.manage"
  | "license.view"
  | "billing.manage"
  | "whatsapp.manage"
  | "messenger.manage";

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  OWNER: [
    "dashboard.view",
    "contacts.view",
    "contacts.manage",
    "inbox.manage",
    "messages.send",
    "messages.viewLogs",
    "autoReply.view",
    "autoReply.manage",
    "campaign.view",
    "campaign.manage",
    "settings.view",
    "settings.manage",
    "team.view",
    "team.manage",
    "license.view",
    "billing.manage",
    "whatsapp.manage",
    "messenger.manage"
  ],
  ADMIN: [
    "dashboard.view",
    "contacts.view",
    "contacts.manage",
    "inbox.manage",
    "messages.send",
    "messages.viewLogs",
    "autoReply.view",
    "autoReply.manage",
    "campaign.view",
    "campaign.manage",
    "settings.view",
    "settings.manage",
    "team.view",
    "team.manage",
    "license.view",
    "billing.manage",
    "whatsapp.manage",
    "messenger.manage"
  ],
  MANAGER: [
    "dashboard.view",
    "contacts.view",
    "contacts.manage",
    "inbox.manage",
    "messages.send",
    "messages.viewLogs",
    "autoReply.view",
    "autoReply.manage",
    "campaign.view",
    "campaign.manage",
    "license.view"
  ],
  AGENT: [
    "dashboard.view",
    "contacts.view",
    "contacts.manage",
    "inbox.manage",
    "messages.send",
    "messages.viewLogs",
    "autoReply.view",
    "campaign.view",
    "license.view"
  ],
  VIEWER: [
    "dashboard.view",
    "contacts.view",
    "messages.viewLogs",
    "autoReply.view",
    "campaign.view",
    "license.view"
  ]
};

export function hasPermission(role: RoleName | string | null | undefined, permission: Permission) {
  if (!role || !isRoleName(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getPermissionsForRole(role: RoleName | string | null | undefined) {
  if (!role || !isRoleName(role)) return [];
  return ROLE_PERMISSIONS[role];
}

export function isPermissionsEnforced() {
  return process.env.PERMISSIONS_ENFORCED === "true";
}

export function isRoleName(role: string): role is RoleName {
  return appRoles.includes(role as RoleName);
}
