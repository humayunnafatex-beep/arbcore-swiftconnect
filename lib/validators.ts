import { z } from "zod";

const phone = z.string().trim().min(8).max(24);
const optionalText = z.string().trim().optional().nullable();

export const contactStageSchema = z.enum(["NEW_LEAD", "INTERESTED", "FOLLOW_UP", "WON", "LOST"]);
export const userRoleSchema = z.enum(["OWNER", "ADMIN", "MANAGER", "AGENT"]);

export const contactCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone,
  email: z.string().trim().email().optional().nullable(),
  tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  segment: optionalText,
  stage: contactStageSchema.optional(),
  optedIn: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const contactUpdateSchema = contactCreateSchema.partial();

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  channel: z.enum(["WHATSAPP", "MESSENGER"]).optional(),
  status: z.enum(["DRAFT", "READY", "PAUSED", "ARCHIVED"]).optional(),
  audienceNote: optionalText,
  audienceStatus: optionalText,
  audienceTags: optionalText,
  audienceSearch: optionalText,
  audienceChannel: z.enum(["", "WHATSAPP", "MESSENGER"]).optional(),
  audienceLimit: z.coerce.number().int().positive().max(10000).optional().nullable(),
  messageBody: z.string().trim().min(1).max(4000),
  templateName: z.string().trim().max(160).optional().default(""),
  templateVariables: z.record(z.string(), z.unknown()).optional(),
  targetSegment: optionalText,
  notes: optionalText,
  whatsappAccountId: optionalText,
  scheduledAt: optionalText
});

export const campaignUpdateSchema = campaignCreateSchema.partial().extend({
  messageBody: z.string().trim().min(1).max(4000).optional()
});

export const campaignSendSchema = z.object({
  messageBody: z.string().trim().min(1).max(4000).optional(),
  limit: z.number().int().min(1).max(10000).optional()
});

export const messageTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION", "SUPPORT"]).optional(),
  language: z.enum(["ENGLISH", "BANGLA", "BANGLISH"]).optional(),
  body: z.string().trim().min(1).max(4000),
  variables: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  footerText: optionalText,
  buttonText: optionalText,
  buttonUrl: optionalText,
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]).optional()
});

export const messageTemplateUpdateSchema = messageTemplateCreateSchema.partial();

export const whatsappAccountCreateSchema = z.object({
  label: z.string().trim().min(1).max(120),
  phoneNumber: phone,
  businessName: optionalText,
  status: z.enum(["CONNECTED", "PENDING", "DISCONNECTED"]).optional(),
  qualityRating: z.string().trim().max(40).optional(),
  dailyLimit: z.number().int().min(1).max(1000000).optional()
});

export const autoReplyRuleCreateSchema = z.object({
  keyword: z.string().trim().min(1).max(120),
  response: z.string().trim().min(1).max(4000),
  priority: z.number().int().min(1).max(999).optional(),
  isActive: z.boolean().optional(),
  matchMode: z.enum(["CONTAINS", "EXACT", "STARTS_WITH"]).optional()
});

export const autoReplyRuleUpdateSchema = autoReplyRuleCreateSchema.partial();

export const crmDealCreateSchema = z.object({
  title: z.string().trim().min(1).max(180),
  contactId: z.string().trim().min(1),
  value: z.number().min(0).optional(),
  stage: contactStageSchema.optional(),
  status: z.enum(["OPEN", "WON", "LOST"]).optional(),
  owner: optionalText,
  nextAction: optionalText,
  dueAt: optionalText
});

export const crmDealUpdateSchema = crmDealCreateSchema.omit({ contactId: true }).partial();

export const conversationCreateSchema = z.object({
  contactId: z.string().trim().min(1),
  whatsappAccountId: optionalText,
  subject: optionalText,
  assignedTo: optionalText,
  body: z.string().trim().min(1).max(4000).optional()
});

export const conversationMessageCreateSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  status: z.enum(["QUEUED", "SENT", "DELIVERED", "READ", "FAILED", "RECEIVED"]).optional()
});

export const aiGenerateMessageSchema = z.object({
  generationType: z
    .enum([
      "campaign_message",
      "product_offer",
      "follow_up",
      "auto_reply",
      "bangla_english_rewrite",
      "short_professional_rewrite"
    ])
    .optional(),
  prompt: z.string().trim().min(1).max(4000).optional(),
  context: optionalText,
  tone: z.enum(["professional", "friendly", "sales", "support"]).optional(),
  customerName: optionalText,
  businessName: optionalText,
  productOrService: optionalText,
  offer: optionalText,
  language: z.enum(["English", "Bangla", "Banglish"]).optional(),
  targetAudience: optionalText,
  originalMessage: optionalText
});

export const teamMemberCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(180),
  role: userRoleSchema.default("AGENT")
});

export const teamMemberUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional()
});

export function normalizeTags(tags: string | string[] | null | undefined) {
  if (!tags) {
    return undefined;
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.trim()).filter(Boolean).join(",");
  }

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(",");
}

export function normalizeVariables(variables: string | string[] | null | undefined) {
  if (!variables) {
    return undefined;
  }

  const items = Array.isArray(variables) ? variables : variables.split(",");

  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("{{") ? item : `{{${item.replace(/[{}]/g, "")}}}`))
    .join(",");
}
