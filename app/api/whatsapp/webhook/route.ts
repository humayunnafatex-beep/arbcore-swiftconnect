import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureDefaultWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWebhookEvent, sendWhatsAppTextMessage, validateSignature } from "@/lib/whatsapp-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  try {
    const company = await getWebhookCompany();
    const verifyToken = company?.whatsappVerifyToken || process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === "subscribe" && challenge && verifyToken && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }

    return new Response("Webhook verification failed.", { status: 403 });
  } catch {
    return new Response("Webhook verification failed.", { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (!validateSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, error: "Invalid WhatsApp webhook signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as Prisma.InputJsonValue;
    const company = await getWebhookCompany();

    if (!company) {
      return NextResponse.json({ success: true, data: { received: true, messages: 0 } });
    }

    const parsed = parseWebhookEvent(payload);

    await prisma.webhookEvent.create({
      data: {
        companyId: company.id,
        provider: "whatsapp",
        eventType: parsed.messages.length ? "messages" : parsed.statuses.length ? "statuses" : "unknown",
        payload
      }
    });

    for (const message of parsed.messages) {
      const body = message.text ?? `[${message.type} message]`;
      const contact = await prisma.contact.upsert({
        where: { phone: message.from },
        update: { companyId: company.id },
        create: {
          companyId: company.id,
          name: `WhatsApp ${message.from}`,
          phone: message.from,
          segment: "WhatsApp Inbox",
          optedIn: true
        }
      });

      const existingInboundLog = await prisma.messageLog.findFirst({
        where: {
          companyId: company.id,
          direction: "INBOUND",
          providerMessageId: message.id
        },
        select: { id: true }
      });

      if (existingInboundLog) {
        continue;
      }

      await prisma.messageLog.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          body,
          direction: "INBOUND",
          status: "RECEIVED",
          providerMessageId: message.id
        }
      });

      if (!message.text) {
        continue;
      }

      const matchedRule = await findMatchedAutoReplyRule(company.id, message.text);

      if (!matchedRule) {
        continue;
      }

      const autoReplyResult = await sendWhatsAppTextMessage({
        phoneNumberId: company.whatsappPhoneNumberId,
        accessToken: company.whatsappAccessToken,
        to: message.from,
        body: matchedRule.response
      });

      await prisma.messageLog.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          body: matchedRule.response,
          direction: "OUTBOUND",
          status: autoReplyResult.success ? "SENT" : "FAILED",
          providerMessageId: autoReplyResult.success ? autoReplyResult.providerMessageId : undefined,
          errorMessage: autoReplyResult.success ? undefined : autoReplyResult.error,
          sentAt: autoReplyResult.success ? new Date() : undefined
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: { received: true, messages: parsed.messages.length, statuses: parsed.statuses.length }
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process WhatsApp webhook." },
      { status: 500 }
    );
  }
}

async function findMatchedAutoReplyRule(companyId: string, inboundText: string) {
  const normalizedInbound = normalizeText(inboundText);

  if (!normalizedInbound) {
    return null;
  }

  const rules = await prisma.autoReplyRule.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });

  return rules.find((rule) => {
    const keyword = normalizeText(rule.keyword);
    if (!keyword) return false;

    if (rule.matchMode === "EXACT") {
      return normalizedInbound === keyword;
    }

    if (rule.matchMode === "STARTS_WITH") {
      return normalizedInbound.startsWith(keyword);
    }

    return normalizedInbound.includes(keyword);
  }) ?? null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

async function getWebhookCompany() {
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });

  if (company) {
    return company;
  }

  // TODO: Replace default-company fallback with explicit multi-workspace webhook routing.
  return (await ensureDefaultWorkspace()).company;
}
