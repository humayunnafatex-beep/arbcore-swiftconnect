export const appRoles = ["OWNER", "ADMIN", "MANAGER", "AGENT", "VIEWER"] as const;

export type AppRole = (typeof appRoles)[number];

export type AppPermission =
  | "dashboard:read"
  | "contacts:read"
  | "contacts:write"
  | "messages:send"
  | "auto-reply:manage"
  | "whatsapp-logs:read"
  | "settings:manage"
  | "team:manage"
  | "license:read"
  | "billing:manage";

export const rolePermissions: Record<AppRole, AppPermission[]> = {
  OWNER: ["dashboard:read", "contacts:read", "contacts:write", "messages:send", "auto-reply:manage", "whatsapp-logs:read", "settings:manage", "team:manage", "license:read", "billing:manage"],
  ADMIN: ["dashboard:read", "contacts:read", "contacts:write", "messages:send", "auto-reply:manage", "whatsapp-logs:read", "settings:manage", "team:manage", "license:read", "billing:manage"],
  MANAGER: ["dashboard:read", "contacts:read", "contacts:write", "messages:send", "auto-reply:manage", "whatsapp-logs:read", "license:read"],
  AGENT: ["dashboard:read", "contacts:read", "contacts:write", "messages:send", "whatsapp-logs:read", "license:read"],
  VIEWER: ["dashboard:read", "contacts:read", "whatsapp-logs:read", "license:read"]
};

export function hasPermission(role: AppRole, permission: AppPermission) {
  // TODO: Enforce this from real authenticated user sessions after beta auth is replaced.
  return rolePermissions[role]?.includes(permission) ?? false;
}
