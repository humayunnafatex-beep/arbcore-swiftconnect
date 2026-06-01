import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getCurrentCompany } from "@/lib/current-company";
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
    const configured = Boolean(company.messengerPageId && company.messengerPageAccessToken);

    if (!configured) {
      return NextResponse.json(
        { success: false, status: "not_configured", error: MESSENGER_REQUIRED_MESSAGE },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        status: "provider_error",
        error: "Messenger Send API implementation is planned. No message was sent."
      },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    return NextResponse.json(
      { success: false, status: "provider_error", error: "Unable to process Messenger test send." },
      { status: 500 }
    );
  }
}
