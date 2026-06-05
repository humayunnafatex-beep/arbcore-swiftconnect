export type StaffRole = "OWNER" | "ADMIN" | "MANAGER" | "AGENT" | "VIEWER";

export const roleGuidance: Record<StaffRole, { label: string; summary: string; focus: string }> = {
  OWNER: {
    label: "Owner",
    summary: "Business owner with full workspace, billing, settings, and team control.",
    focus: "Full app access and final approval for admin/system changes."
  },
  ADMIN: {
    label: "Admin",
    summary: "Admin operator with full operations and configuration support.",
    focus: "Full app access for setup, staff support, provider settings, and daily operations."
  },
  MANAGER: {
    label: "Manager",
    summary: "Daily operations manager for customer, order, product, and automation work.",
    focus: "Inbox, Contacts, Orders, Products, Saved Replies, Auto Reply, Activity Logs, and operations metrics."
  },
  AGENT: {
    label: "Agent",
    summary: "Customer support and order-handling operator.",
    focus: "Inbox, Contacts, Orders, and Saved Replies. Admin, billing, and system controls are owner/admin responsibilities."
  },
  VIEWER: {
    label: "Viewer",
    summary: "Read-oriented reviewer role for selected beta workflows.",
    focus: "Review dashboards, logs, and selected records where available. The Prisma user role enum does not yet create VIEWER users."
  }
};

export function normalizeStaffRole(value: string | null | undefined): StaffRole {
  const role = String(value ?? "").toUpperCase();
  if (role === "OWNER" || role === "ADMIN" || role === "MANAGER" || role === "AGENT" || role === "VIEWER") return role;
  return "AGENT";
}

export function getRoleGuidance(value: string | null | undefined) {
  return roleGuidance[normalizeStaffRole(value)];
}
