import { Prisma } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api";
import { getCurrentCompany } from "@/lib/current-company";
import { prisma } from "@/lib/prisma";
import { parseWebhookEvent, validateSignature, verifyWebhook } from "@/lib/whatsapp-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stopWords = new Set(["stop", "unsubscribe", "cancel", "optout", "opt-out"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const challenge = verifyWebhook(
      searchParams.get("hub.mode"),
      searchParams.get("hub.verify_token"),
      searchParams.get("hub.challenge")
    );
    return new Response(challenge, { status: 200 });
  } catch {
    return new Response("Webhook verification failed.", { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (!validateSignature(rawBody, signature)) {
      return new Response("Invalid WhatsApp webhook signature.", { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Prisma.InputJsonValue;
    const company = await getCurrentCompany();
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
      const isStop = stopWords.has(body.trim().toLowerCase());
      const contact = await prisma.contact.upsert({
        where: { phone: message.from },
        update: {
          companyId: company.id,
          ...(isStop ? { optedIn: false, doNotContact: true, tags: "unsubscribed" } : {})
        },
        create: {
          companyId: company.id,
          name: `WhatsApp ${message.from}`,
          phone: message.from,
          segment: "WhatsApp Inbox",
          optedIn: !isStop,
          doNotContact: isStop,
          tags: isStop ? "unsubscribed" : undefined
        }
      });

      const existingConversation = await prisma.conversation.findFirst({
        where: { companyId: company.id, contactId: contact.id, status: "OPEN" },
        orderBy: { updatedAt: "desc" }
      });
      const conversation =
        existingConversation ??
        (await prisma.conversation.create({
          data: {
            companyId: company.id,
            contactId: contact.id,
            subject: isStop ? "Unsubscribe request" : "WhatsApp message",
            status: "OPEN",
            lastMessageAt: new Date()
          }
        }));

      await prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          body,
          direction: "INBOUND",
          status: "RECEIVED"
        }
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), updatedAt: new Date() }
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
    }

    for (const status of parsed.statuses) {
      const mapped = mapStatus(status.status);
      await prisma.messageLog.updateMany({
        where: { companyId: company.id, providerMessageId: status.id },
        data: {
          status: mapped,
          deliveredAt: mapped === "DELIVERED" ? new Date() : undefined,
          readAt: mapped === "READ" ? new Date() : undefined,
          errorMessage: status.errorMessage
        }
      });
    }

    return ok({ received: true, messages: parsed.messages.length, statuses: parsed.statuses.length });
  } catch (error) {
    return handleApiError(error);
  }
}

function mapStatus(status: string) {
  if (status === "delivered") return "DELIVERED";
  if (status === "read") return "READ";
  if (status === "failed") return "FAILED";
  return "SENT";
}
