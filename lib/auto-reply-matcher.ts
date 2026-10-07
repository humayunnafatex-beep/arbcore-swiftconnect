import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ACTIVE_AUTO_REPLY_RULE_LIMIT = 250;

export type AutoReplyRuleForMatch = {
  keyword: string;
  matchMode: string;
};

export async function findMatchedAutoReplyRule(
  companyId: string,
  inboundText: string,
  db: Pick<Prisma.TransactionClient, "autoReplyRule"> = prisma
) {
  const normalizedInbound = normalizeAutoReplyText(inboundText);

  if (!normalizedInbound) {
    return null;
  }

  const rules = await db.autoReplyRule.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: ACTIVE_AUTO_REPLY_RULE_LIMIT
  });

  return rules.find((rule) => doesAutoReplyRuleMatch(rule, normalizedInbound)) ?? null;
}

export function doesAutoReplyRuleMatch(rule: AutoReplyRuleForMatch, normalizedInboundText: string) {
  const keyword = normalizeAutoReplyText(rule.keyword);
  if (!keyword) return false;

  if (rule.matchMode === "EXACT") {
    return normalizedInboundText === keyword;
  }

  if (rule.matchMode === "STARTS_WITH") {
    return normalizedInboundText.startsWith(keyword);
  }

  return normalizedInboundText.includes(keyword);
}

export function normalizeAutoReplyText(value: string) {
  return value.trim().toLowerCase();
}

export async function evaluateAutoReplyPreflight({
  companyId,
  text,
  db = prisma
}: {
  companyId: string;
  text: string;
  db?: Pick<Prisma.TransactionClient, "autoReplyRule">;
}) {
  const normalizedInbound = normalizeAutoReplyText(text);

  if (!normalizedInbound) {
    return {
      activeRuleCount: 0,
      wouldMatch: false
    };
  }

  const rules = await db.autoReplyRule.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: ACTIVE_AUTO_REPLY_RULE_LIMIT,
    select: {
      keyword: true,
      matchMode: true
    }
  });

  return {
    activeRuleCount: rules.length,
    wouldMatch: rules.some((rule) => doesAutoReplyRuleMatch(rule, normalizedInbound))
  };
}
