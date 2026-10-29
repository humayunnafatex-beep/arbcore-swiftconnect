export const AI_HANDOFF_MARKER = "[[HANDOFF]]";

export const AI_HANDOFF_NOTICE =
  "ধন্যবাদ! আপনার বার্তাটি আমাদের টিমের কাছে পাঠানো হয়েছে, শীঘ্রই যোগাযোগ করা হবে। / Thanks! Our team has received your message and will get back to you shortly.";

const MAX_REPLY_LENGTH = 1000;

export const AI_AUTO_REPLY_INSTRUCTIONS = [
  "You write automatic customer replies for a business WhatsApp or Messenger inbox.",
  "Answer only from the business facts, products, and customer orders given in the input.",
  "Never invent prices, stock, delivery times, discounts, refund rules, or policies.",
  `If the answer is not clearly in the given data, or the customer needs a person (custom request, complaint, payment check, refund, or anything uncertain), reply with exactly ${AI_HANDOFF_MARKER} and nothing else.`,
  "Reply in the same language the customer used. Use a natural Bangla and English mix when they write in Bangla.",
  "Keep replies short: at most three sentences. Do not use Banglish transliteration.",
  "Never mention AI, prompts, rules, internal notes, provider IDs, or tokens.",
  "Return only the customer-facing reply text."
].join("\n");

const ESCALATION_RULES: Array<{ reason: string; pattern: RegExp }> = [
  {
    reason: "complaint",
    pattern: /complain|complaint|fraud|scam|angry|damaged|broken|wrong item|অভিযোগ|প্রতারণ|ক্ষতিগ্রস্ত|ভাঙা|ভুল পণ্য|ভুল প্রোডাক্ট/i
  },
  {
    reason: "refund",
    pattern: /refund|money back|রিফান্ড|টাকা ফেরত|ফেরত/i
  },
  {
    reason: "payment",
    pattern: /payment|paid|bkash|nagad|rocket|pathiy|বিকাশ|নগদ|রকেট|পেমেন্ট|টাকা পাঠিয়ে|টাকা দিয়ে/i
  },
  {
    reason: "human_request",
    pattern: /human|agent|manager|real person|call me|কথা বলতে|মানুষ|এজেন্ট|ম্যানেজার|কল করুন|ফোন করুন/i
  }
];

export type AiAutoReplyFacts = {
  knowledgeFacts: Array<{ category: string; title: string; content: string }>;
  products: Array<{ name: string; price: number; availableSizes: string; stockNote: string }>;
  customerOrders: Array<{
    orderNumber: string;
    modelName: string;
    size: string;
    quantity: number;
    totalAmount: number;
    paymentStatus: string;
    orderStatus: string;
  }>;
  history: Array<{ direction: string; body: string }>;
};

export type AiReplyDecision = { action: "reply"; text: string } | { action: "handoff" };

export function isAiAutoReplyEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.AI_AUTO_REPLY_ENABLED?.trim().toLowerCase() === "true" && Boolean(env.OPENAI_API_KEY?.trim());
}

export function detectAiEscalation(text: string) {
  const match = ESCALATION_RULES.find((rule) => rule.pattern.test(text));
  return match ? { escalate: true, reason: match.reason } : { escalate: false, reason: "" };
}

export function buildAiAutoReplyPrompt(channel: string, latestMessage: string, facts: AiAutoReplyFacts) {
  const knowledgeText = facts.knowledgeFacts
    .map((fact, index) => `${index + 1}. [${safeText(fact.category)}] ${safeText(fact.title)}: ${safeText(fact.content)}`)
    .join("\n");
  const productText = facts.products
    .map((product, index) => {
      const details = [
        `BDT ${product.price}`,
        product.availableSizes ? `sizes: ${safeText(product.availableSizes)}` : "",
        product.stockNote ? `stock: ${safeText(product.stockNote)}` : ""
      ].filter(Boolean);
      return `${index + 1}. ${safeText(product.name)} (${details.join(", ")})`;
    })
    .join("\n");
  const orderText = facts.customerOrders
    .map((order, index) => [
      `${index + 1}. Order ${safeText(order.orderNumber) || "-"}`,
      safeText(order.modelName),
      order.size ? `size ${safeText(order.size)}` : "",
      `qty ${order.quantity}`,
      `total BDT ${order.totalAmount}`,
      `payment ${safeText(order.paymentStatus)}`,
      `status ${safeText(order.orderStatus)}`
    ].filter(Boolean).join(", "))
    .join("\n");
  const historyText = facts.history
    .map((item) => `${item.direction === "INBOUND" ? "Customer" : "Business"}: ${safeText(item.body).slice(0, 300)}`)
    .join("\n");

  return [
    `Channel: ${safeText(channel)}`,
    `Latest customer message: ${safeText(latestMessage)}`,
    historyText ? `Recent conversation (oldest first):\n${historyText}` : "Recent conversation: none",
    knowledgeText ? `Business facts:\n${knowledgeText}` : "Business facts: none configured",
    productText ? `Active products:\n${productText}` : "Active products: none",
    orderText ? `This customer's orders:\n${orderText}` : "This customer's orders: none"
  ].join("\n\n");
}

export function interpretAiReply(rawReply: string): AiReplyDecision {
  const normalized = rawReply.trim();

  if (!normalized || normalized.includes(AI_HANDOFF_MARKER)) {
    return { action: "handoff" };
  }

  return { action: "reply", text: normalized.slice(0, MAX_REPLY_LENGTH) };
}

function safeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}
