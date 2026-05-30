import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureDefaultWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWebhookEvent, validateSignature } from "@/lib/whatsapp-service";

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

      // TODO: Match active auto-reply rules here and send replies only after webhook routing is multi-workspace safe.
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

async function getWebhookCompany() {
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });

  if (company) {
    return company;
  }

  // TODO: Replace default-company fallback with explicit multi-workspace webhook routing.
  return (await ensureDefaultWorkspace()).company;
}
