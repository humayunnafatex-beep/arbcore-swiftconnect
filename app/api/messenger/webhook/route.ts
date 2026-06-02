import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentCompany } from "@/lib/current-company";
import { sendMessengerTextMessage } from "@/lib/messenger-service";
import { prisma } from "@/lib/prisma";
import { getCompanyForProviderWebhook, type ProviderRoutingResult } from "@/lib/provider-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MessengerPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: {
        mid?: string;
        text?: string;
      };
      postback?: {
        mid?: string;
        title?: string;
        payload?: string;
      };
    }>;
  }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  try {
    const company = await getCurrentCompany();
    const verifyToken = company?.messengerVerifyToken || process.env.MESSENGER_VERIFY_TOKEN;

    if (mode === "subscribe" && challenge && verifyToken && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }

    return new Response("Messenger webhook verification failed.", { status: 403 });
  } catch {
    return new Response("Messenger webhook verification failed.", { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as MessengerPayload | null;

    if (!payload) {
      return NextResponse.json({ success: true, data: { received: true, messages: 0 } });
    }

    const routing = await getCompanyForProviderWebhook({ channel: "MESSENGER", payload });
    const company = routing.company;
    const messages = extractMessengerMessages(payload);

    await prisma.webhookEvent.create({
      data: {
        companyId: company.id,
        provider: "messenger",
        eventType: messages.length ? "messages" : "unknown",
        payload: sanitizeMessengerWebhookPayload(payload, messages, routing) as Prisma.InputJsonValue
      }
    });

    for (const message of messages) {
      const existingInboundLog = message.providerMessageId
        ? await prisma.messageLog.findFirst({
            where: {
              companyId: company.id,
              channel: "MESSENGER",
              direction: "INBOUND",
              providerMessageId: message.providerMessageId
            },
            select: { id: true }
          })
        : null;

      if (existingInboundLog) {
        continue;
      }

      const contact = await findOrCreateWebhookContact({
        companyId: company.id,
        phone: message.senderPsid,
        name: `Messenger ${message.senderPsid}`,
        segment: "Messenger Inbox"
      });

      await prisma.messageLog.create({
        data: {
          companyId: company.id,
          contactId: contact?.id,
          channel: "MESSENGER",
          body: message.text,
          direction: "INBOUND",
          status: "RECEIVED",
          providerMessageId: message.providerMessageId
        }
      });

      const matchedRule = await findMatchedAutoReplyRule(company.id, message.text);

      if (!matchedRule) {
        continue;
      }

      if (!company.messengerPageAccessToken) {
        await prisma.messageLog.create({
          data: {
            companyId: company.id,
            contactId: contact?.id,
            channel: "MESSENGER",
            body: matchedRule.response,
            direction: "OUTBOUND",
            status: "FAILED",
            errorMessage: "Messenger Page API is required to send real messages."
          }
        });
        continue;
      }

      const autoReplyResult = await sendMessengerTextMessage({
        pageAccessToken: company.messengerPageAccessToken,
        recipientId: message.senderPsid,
        body: matchedRule.response
      });

      await prisma.messageLog.create({
        data: {
          companyId: company.id,
          contactId: contact?.id,
          channel: "MESSENGER",
          body: matchedRule.response,
          direction: "OUTBOUND",
          status: autoReplyResult.success ? "SENT" : "FAILED",
          providerMessageId: autoReplyResult.success ? autoReplyResult.providerMessageId : undefined,
          errorMessage: autoReplyResult.success ? undefined : autoReplyResult.error,
          sentAt: autoReplyResult.success ? new Date() : undefined
        }
      });
    }

    return NextResponse.json({ success: true, data: { received: true, messages: messages.length } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process Messenger webhook." },
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

async function findOrCreateWebhookContact({
  companyId,
  phone,
  name,
  segment
}: {
  companyId: string;
  phone: string;
  name: string;
  segment: string;
}) {
  const existing = await prisma.contact.findFirst({
    where: { companyId, phone }
  });

  if (existing) {
    return existing;
  }

  try {
    return await prisma.contact.create({
      data: {
        companyId,
        name,
        phone,
        segment,
        optedIn: true
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Current beta schema keeps Contact.phone globally unique. Do not reassign
      // another workspace's contact while provider routing is being hardened.
      return null;
    }

    throw error;
  }
}

function extractMessengerMessages(payload: MessengerPayload) {
  return (payload.entry ?? [])
    .flatMap((entry) => entry.messaging ?? [])
    .map((event) => {
      const senderPsid = event.sender?.id?.trim() ?? "";
      const text = event.message?.text?.trim() || event.postback?.title?.trim() || "[messenger event]";
      return {
        senderPsid,
        text,
        providerMessageId: event.message?.mid ?? event.postback?.mid ?? undefined,
        timestamp: event.timestamp
      };
    })
    .filter((message) => message.senderPsid && message.text);
}

function sanitizeMessengerWebhookPayload(payload: MessengerPayload, messages: ReturnType<typeof extractMessengerMessages>, routing: ProviderRoutingResult) {
  const providerIds = routing.providerIds as { pageId?: string; senderId?: string };

  return {
    provider: "messenger",
    object: payload.object ?? "page",
    messageCount: messages.length,
    senderCount: new Set(messages.map((message) => message.senderPsid)).size,
    routing: {
      routedBy: routing.routedBy,
      messengerPageIdPresent: Boolean(providerIds.pageId),
      senderPresent: Boolean(providerIds.senderId)
    },
    receivedAt: new Date().toISOString()
  };
}
