import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentCompany } from "@/lib/current-company";
import { prisma } from "@/lib/prisma";

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
    const company = await getCurrentCompany();

    if (!payload || !company) {
      return NextResponse.json({ success: true, data: { received: true, messages: 0 } });
    }

    const messages = extractMessengerMessages(payload);

    await prisma.webhookEvent.create({
      data: {
        companyId: company.id,
        provider: "messenger",
        eventType: messages.length ? "messages" : "unknown",
        payload: sanitizeMessengerWebhookPayload(payload, messages) as Prisma.InputJsonValue
      }
    });

    for (const message of messages) {
      const existingInboundLog = message.providerMessageId
        ? await prisma.messageLog.findFirst({
            where: {
              companyId: company.id,
              direction: "INBOUND",
              providerMessageId: message.providerMessageId
            },
            select: { id: true }
          })
        : null;

      if (existingInboundLog) {
        continue;
      }

      const contact = await prisma.contact.upsert({
        where: { phone: message.senderPsid },
        update: { companyId: company.id },
        create: {
          companyId: company.id,
          name: `Messenger ${message.senderPsid}`,
          phone: message.senderPsid,
          segment: "Messenger Inbox",
          optedIn: true
        }
      });

      await prisma.messageLog.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          channel: "MESSENGER",
          body: message.text,
          direction: "INBOUND",
          status: "RECEIVED",
          providerMessageId: message.providerMessageId
        }
      });
    }

    // TODO: Messenger auto-reply Phase 2 should match rules and send only after Send API success.
    return NextResponse.json({ success: true, data: { received: true, messages: messages.length } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process Messenger webhook." },
      { status: 500 }
    );
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

function sanitizeMessengerWebhookPayload(payload: MessengerPayload, messages: ReturnType<typeof extractMessengerMessages>) {
  return {
    provider: "messenger",
    object: payload.object ?? "page",
    messageCount: messages.length,
    senderCount: new Set(messages.map((message) => message.senderPsid)).size,
    receivedAt: new Date().toISOString()
  };
}
