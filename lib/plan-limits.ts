export type PlanName = "ENTERPRISE_BETA" | "STARTER" | "BUSINESS" | "AGENCY" | "ENTERPRISE";
export type NumericLimit = number | null;

export type PlanLimits = {
  contacts: NumericLimit;
  teamMembers: NumericLimit;
  autoReplyRules: NumericLimit;
  monthlyMessages: NumericLimit;
  channels: Array<"WHATSAPP" | "MESSENGER">;
  inboxConversations: NumericLimit;
  manualBilling: boolean;
  supportLevel: string;
};

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  ENTERPRISE_BETA: {
    contacts: 1000,
    teamMembers: 10,
    autoReplyRules: 50,
    monthlyMessages: 5000,
    channels: ["WHATSAPP", "MESSENGER"],
    inboxConversations: 1000,
    manualBilling: true,
    supportLevel: "Beta support"
  },
  STARTER: {
    contacts: 500,
    teamMembers: 3,
    autoReplyRules: 10,
    monthlyMessages: 1000,
    channels: ["WHATSAPP"],
    inboxConversations: 250,
    manualBilling: true,
    supportLevel: "Standard support"
  },
  BUSINESS: {
    contacts: 3000,
    teamMembers: 10,
    autoReplyRules: 50,
    monthlyMessages: 10000,
    channels: ["WHATSAPP", "MESSENGER"],
    inboxConversations: 3000,
    manualBilling: true,
    supportLevel: "Business support"
  },
  AGENCY: {
    contacts: 10000,
    teamMembers: 25,
    autoReplyRules: 200,
    monthlyMessages: 50000,
    channels: ["WHATSAPP", "MESSENGER"],
    inboxConversations: 10000,
    manualBilling: true,
    supportLevel: "Priority support"
  },
  ENTERPRISE: {
    contacts: null,
    teamMembers: null,
    autoReplyRules: null,
    monthlyMessages: null,
    channels: ["WHATSAPP", "MESSENGER"],
    inboxConversations: null,
    manualBilling: true,
    supportLevel: "Custom support"
  }
};

export function normalizePlanName(plan: string | null | undefined): PlanName {
  if (plan === "STARTER" || plan === "BUSINESS" || plan === "AGENCY" || plan === "ENTERPRISE" || plan === "ENTERPRISE_BETA") {
    return plan;
  }

  return "ENTERPRISE_BETA";
}

export function getPlanLimits(plan: string | null | undefined) {
  return PLAN_LIMITS[normalizePlanName(plan)];
}

export function calculateUsagePercent(used: number, limit: NumericLimit) {
  if (!limit) return null;
  return Math.round((used / limit) * 100);
}

export function isOverLimit(used: number, limit: NumericLimit) {
  return typeof limit === "number" && used > limit;
}

export function formatLimit(limit: NumericLimit) {
  return limit === null ? "Custom" : limit.toLocaleString();
}
