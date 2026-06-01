import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getCurrentCompany } from "@/lib/current-company";
import { sendMessengerTextMessage } from "@/lib/messenger-service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messengerTestSendSchema = z.object({
  recipientPsid: z.string().trim().min(3).max(128),
  body: z.string().trim().min(1).max(2000)
});

const MESSENGER_REQUIRED_MESSAGE = "Messenger Page API is required to send real messages.";

export async function GET() {
  try {
    await requirePermission("messages.send");
    const company = await getCurrentCompany();
    const configured = Boolean(company.messengerPageId && company.messengerPageAccessToken);

    return NextResponse.json({
      success: true,
      data: {
        configured,
        pageId: company.messengerPageId,
        hasPageAccessToken: Boolean(company.messengerPageAccessToken),
        webhookUrl: company.messengerWebhookUrl,
        webhookStatus: company.messengerVerifyToken ? "Ready to verify" : "Verify token missing",
        state: configured ? "configured" : "not_configured"
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    return NextResponse.json(
      { success: false, status: "provider_error", error: "Unable to load Messenger configuration." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let companyId: string | undefined;
  let contactId: string | undefined;
  let messageBody = "";

  try {
    await requirePermission("messages.send");
    const payload = await request.json().catch(() => null);
    const parsed = messengerTestSendSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Recipient PSID and message body are required." },
        { status: 400 }
      );
    }

    const company = await getCurrentCompany();
    companyId = company.id;
    const configured = Boolean(company.messengerPageId && company.messengerPageAccessToken);
    const input = parsed.data;
    const recipientPsid = input.recipientPsid.trim();
    messageBody = input.body.trim();

    const contact = await prisma.contact.upsert({
      where: { phone: recipientPsid },
      update: { companyId: company.id },
      create: {
        companyId: company.id,
        name: `Messenger ${recipientPsid}`,
        phone: recipientPsid,
        segment: "Messenger Test",
        optedIn: true
      }
    });
    contactId = contact.id;

    if (!configured) {
      await createSafeMessengerLog({
        companyId: company.id,
        contactId: contact.id,
        body: messageBody,
        status: "FAILED",
        errorMessage: MESSENGER_REQUIRED_MESSAGE
      });

      return NextResponse.json(
        { success: false, status: "not_configured", error: MESSENGER_REQUIRED_MESSAGE },
        { status: 400 }
      );
    }

    const providerResult = await sendMessengerTextMessage({
      pageAccessToken: company.messengerPageAccessToken,
      recipientId: recipientPsid,
      body: messageBody
    });

    if (!providerResult.success) {
      await createSafeMessengerLog({
        companyId: company.id,
        contactId: contact.id,
        body: messageBody,
        status: "FAILED",
        errorMessage: providerResult.error
      });

      return NextResponse.json(
        { success: false, status: "provider_error", error: "Messenger provider rejected the message." },
        { status: 502 }
      );
    }

    await createSafeMessengerLog({
      companyId: company.id,
      contactId: contact.id,
      body: messageBody,
      status: "SENT",
      providerMessageId: providerResult.providerMessageId,
      sentAt: new Date()
    });

    return NextResponse.json({
      success: true,
      status: "sent_successfully",
      data: { providerMessageId: providerResult.providerMessageId }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    if (companyId && contactId && messageBody) {
      await createSafeMessengerLog({
        companyId,
        contactId,
        body: messageBody,
        status: "FAILED",
        errorMessage: "Messenger test send failed unexpectedly."
      }).catch(() => undefined);
    }

    return NextResponse.json(
      { success: false, status: "provider_error", error: "Unable to process Messenger test send." },
      { status: 500 }
    );
  }
}

async function createSafeMessengerLog(input: {
  companyId: string;
  contactId?: string;
  body: string;
  status: "SENT" | "FAILED";
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
}) {
  return prisma.messageLog.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      channel: "MESSENGER",
      body: input.body,
      direction: "OUTBOUND",
      status: input.status,
      providerMessageId: input.providerMessageId,
      errorMessage: input.errorMessage,
      sentAt: input.sentAt
    }
  });
}
