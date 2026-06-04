import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const channels = ["ALL", "WHATSAPP", "MESSENGER"] as const;
const dayOptions = [7, 30, 90] as const;

type AutoReplyEventRow = {
  id: string;
  ruleId: string | null;
  ruleName: string;
  channel: string;
  customerKey: string;
  inboundTextPreview: string;
  replyPreview: string;
  status: string;
  providerMessageId: string;
  errorMessage: string;
  createdAt: Date;
};

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("autoReply.view");
    const { searchParams } = new URL(request.url);
    const channel = parseChannel(searchParams.get("channel"));
    const days = parseDays(searchParams.get("days"));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where = {
      companyId: context.company.id,
      createdAt: { gte: since },
      ...(channel === "ALL" ? {} : { channel })
    };

    const events = await prisma.autoReplyEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ruleId: true,
        ruleName: true,
        channel: true,
        customerKey: true,
        inboundTextPreview: true,
        replyPreview: true,
        status: true,
        providerMessageId: true,
        errorMessage: true,
        createdAt: true
      }
    });

    const summary = summarize(events);
    const ruleMap = new Map<string, {
      ruleId: string | null;
      ruleName: string;
      channel: string;
      attempted: number;
      sent: number;
      failed: number;
      lastTriggeredAt: string | null;
    }>();

    for (const event of events) {
      const key = `${event.ruleId ?? event.ruleName}:${event.channel}`;
      const current = ruleMap.get(key) ?? {
        ruleId: event.ruleId,
        ruleName: event.ruleName || "Auto Reply Rule",
        channel: event.channel,
        attempted: 0,
        sent: 0,
        failed: 0,
        lastTriggeredAt: null
      };

      current.attempted += 1;
      if (event.status === "SENT") current.sent += 1;
      if (event.status === "FAILED") current.failed += 1;
      if (!current.lastTriggeredAt) current.lastTriggeredAt = event.createdAt.toISOString();
      ruleMap.set(key, current);
    }

    const byRule = Array.from(ruleMap.values()).map((rule) => ({
      ...rule,
      successRate: rate(rule.sent, rule.attempted)
    }));

    return ok({
      filters: { channel, days },
      summary,
      byRule,
      recentEvents: events.slice(0, 50).map(formatEvent)
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function summarize(events: AutoReplyEventRow[]) {
  const attempted = events.length;
  const sent = events.filter((event) => event.status === "SENT").length;
  const failed = events.filter((event) => event.status === "FAILED").length;

  return {
    attempted,
    sent,
    failed,
    successRate: rate(sent, attempted)
  };
}

function formatEvent(event: AutoReplyEventRow) {
  return {
    id: event.id,
    ruleName: event.ruleName || "Auto Reply Rule",
    channel: event.channel,
    customerKey: event.customerKey,
    inboundTextPreview: event.inboundTextPreview,
    replyPreview: event.replyPreview,
    status: event.status,
    errorMessage: event.errorMessage,
    createdAt: event.createdAt.toISOString()
  };
}

function parseChannel(value: string | null) {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "WHATSAPP" || normalized === "MESSENGER" || normalized === "ALL") {
    return normalized;
  }

  return "ALL";
}

function parseDays(value: string | null) {
  const parsed = Number(value ?? 30);
  if (parsed === 7 || parsed === 30 || parsed === 90) {
    return parsed;
  }

  return 30;
}

function rate(sent: number, attempted: number) {
  if (!attempted) return 0;
  return Math.round((sent / attempted) * 100);
}
