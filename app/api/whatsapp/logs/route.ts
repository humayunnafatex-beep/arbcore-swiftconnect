import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { context } = await requirePermission("messages.viewLogs");
    const { company } = context;

    const [messages, webhookEvents] = await Promise.all([
      prisma.messageLog.findMany({
        where: { companyId: company.id },
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { contact: true, whatsappAccount: true }
      }),
      prisma.webhookEvent.findMany({
        where: { companyId: company.id, provider: { in: ["whatsapp", "messenger"] } },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          provider: true,
          eventType: true,
          payload: true,
          createdAt: true
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((message) => ({
          id: message.id,
          direction: message.direction,
          channel: message.channel,
          phone: message.contact?.phone ?? message.whatsappAccount?.phoneNumber ?? "",
          bodyPreview: previewText(message.body),
          status: message.status,
          providerMessageId: message.providerMessageId,
          providerStatus: message.status,
          errorMessage: message.errorMessage,
          createdAt: message.createdAt
        })),
        webhookEvents: webhookEvents.map((event) => ({
          id: event.id,
          provider: event.provider,
          eventType: event.eventType ?? "unknown",
          summary: summarizeWebhookPayload(event.payload),
          createdAt: event.createdAt
        }))
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    console.error("WhatsApp logs GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load WhatsApp logs." },
      { status: 500 }
    );
  }
}

function previewText(value: string, maxLength = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function summarizeWebhookPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "Webhook event received.";
  }

  const value = payload as {
    provider?: string;
    messageCount?: number;
    senderCount?: number;
    entry?: Array<{
      changes?: Array<{
        field?: string;
        value?: {
          messages?: unknown[];
          statuses?: unknown[];
          contacts?: unknown[];
        };
      }>;
    }>;
  };

  if (value.provider === "messenger") {
    const messageCount = value.messageCount ?? 0;
    const senderCount = value.senderCount ?? 0;
    return messageCount
      ? `Messenger webhook received: ${messageCount} message event${messageCount === 1 ? "" : "s"} from ${senderCount} sender${senderCount === 1 ? "" : "s"}.`
      : "Messenger webhook event received.";
  }

  const changes = value.entry?.flatMap((entry) => entry.changes ?? []) ?? [];
  const messageCount = changes.reduce((total, change) => total + (change.value?.messages?.length ?? 0), 0);
  const statusCount = changes.reduce((total, change) => total + (change.value?.statuses?.length ?? 0), 0);
  const contactCount = changes.reduce((total, change) => total + (change.value?.contacts?.length ?? 0), 0);
  const fields = [...new Set(changes.map((change) => change.field).filter(Boolean))].join(", ");
  const parts = [
    fields ? `fields: ${fields}` : null,
    messageCount ? `${messageCount} message event${messageCount === 1 ? "" : "s"}` : null,
    statusCount ? `${statusCount} status event${statusCount === 1 ? "" : "s"}` : null,
    contactCount ? `${contactCount} contact${contactCount === 1 ? "" : "s"}` : null
  ].filter(Boolean);

  return parts.length ? parts.join("; ") : "Webhook event received.";
}
