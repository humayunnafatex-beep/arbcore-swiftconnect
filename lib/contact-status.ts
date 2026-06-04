export const contactStatusOptions = [
  { value: "NEW_LEAD", label: "New" },
  { value: "INTERESTED", label: "Interested" },
  { value: "ORDERED", label: "Ordered" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "LOST", label: "Lost" }
] as const;

export const legacyContactStatusOptions = [
  { value: "WON", label: "Customer" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "HOT", label: "Hot" },
  { value: "COLD", label: "Cold" },
  { value: "LEAD", label: "Lead" },
  { value: "CUSTOMER", label: "Customer" }
] as const;

export type ContactStatusValue = (typeof contactStatusOptions)[number]["value"] | "WON";

const statusAliasMap: Record<string, ContactStatusValue> = {
  NEW: "NEW_LEAD",
  NEW_LEAD: "NEW_LEAD",
  LEAD: "NEW_LEAD",
  INTERESTED: "INTERESTED",
  HOT: "INTERESTED",
  ORDERED: "ORDERED",
  CUSTOMER: "ORDERED",
  WON: "ORDERED",
  DELIVERED: "DELIVERED",
  FOLLOW_UP: "FOLLOW_UP",
  FOLLOWUP: "FOLLOW_UP",
  FOLLOW: "FOLLOW_UP",
  COLD: "LOST",
  LOST: "LOST",
  ACTIVE: "INTERESTED",
  INACTIVE: "LOST"
};

const labelMap = new Map<string, string>([
  ...contactStatusOptions.map((option) => [option.value, option.label] as const),
  ...legacyContactStatusOptions.map((option) => [option.value, option.label] as const)
]);

export function normalizeContactStatus(value: string | null | undefined): ContactStatusValue {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!normalized) return "NEW_LEAD";
  return statusAliasMap[normalized] ?? (isKnownContactStatus(normalized) ? normalized : "NEW_LEAD");
}

export function getContactStatusLabel(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return "New";
  return labelMap.get(normalized) ?? labelizeStatus(normalized);
}

export function getContactStatusOptions() {
  return [...contactStatusOptions];
}

export function isValidContactStatus(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return Boolean(normalized && (statusAliasMap[normalized] || isKnownContactStatus(normalized)));
}

function isKnownContactStatus(value: string): value is ContactStatusValue {
  return value === "NEW_LEAD" || value === "INTERESTED" || value === "ORDERED" || value === "DELIVERED" || value === "FOLLOW_UP" || value === "LOST" || value === "WON";
}

function labelizeStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
