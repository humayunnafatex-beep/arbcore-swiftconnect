import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WHATSAPP_WEBHOOK_PATH = "/api/whatsapp/webhook" as const;
const MESSENGER_WEBHOOK_PATH = "/api/messenger/webhook" as const;

export async function GET() {
  try {
    const { context } = await requirePermission("settings.view");
    const { company } = context;

    const whatsappMissing = [
      !company.whatsappPhoneNumberId ? "whatsappPhoneNumberId" : null,
      !company.whatsappAccessToken ? "whatsappAccessToken" : null,
      !company.whatsappVerifyToken ? "whatsappVerifyToken" : null,
      !company.whatsappWebhookUrl ? "whatsappWebhookUrl" : null
    ].filter(Boolean) as string[];

    const messengerMissing = [
      !company.messengerPageId ? "messengerPageId" : null,
      !company.messengerPageAccessToken ? "messengerPageAccessToken" : null,
      !company.messengerVerifyToken ? "messengerVerifyToken" : null,
      !company.messengerWebhookUrl ? "messengerWebhookUrl" : null
    ].filter(Boolean) as string[];

    return ok({
      whatsapp: {
        readyForOutbound: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
        readyForWebhook: Boolean(company.whatsappVerifyToken && (company.whatsappWebhookUrl || WHATSAPP_WEBHOOK_PATH)),
        missing: whatsappMissing,
        webhookPath: WHATSAPP_WEBHOOK_PATH,
        webhookUrl: company.whatsappWebhookUrl || null
      },
      messenger: {
        readyForOutbound: Boolean(company.messengerPageId && company.messengerPageAccessToken),
        readyForWebhook: Boolean(company.messengerVerifyToken && (company.messengerWebhookUrl || MESSENGER_WEBHOOK_PATH)),
        missing: messengerMissing,
        webhookPath: MESSENGER_WEBHOOK_PATH,
        webhookUrl: company.messengerWebhookUrl || null
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
