import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { context } = await requirePermission("settings.view");
    const { company } = context;

    return ok({
      whatsapp: {
        configured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
        phoneNumberIdPresent: Boolean(company.whatsappPhoneNumberId),
        accessTokenPresent: Boolean(company.whatsappAccessToken),
        verifyTokenPresent: Boolean(company.whatsappVerifyToken),
        webhookUrl: company.whatsappWebhookUrl || null,
        webhookPath: "/api/whatsapp/webhook",
        sendTestPath: "/send-messages",
        logsPath: "/message-logs"
      },
      messenger: {
        configured: Boolean(company.messengerPageId && company.messengerPageAccessToken),
        pageIdPresent: Boolean(company.messengerPageId),
        pageAccessTokenPresent: Boolean(company.messengerPageAccessToken),
        verifyTokenPresent: Boolean(company.messengerVerifyToken),
        webhookUrl: company.messengerWebhookUrl || null,
        webhookPath: "/api/messenger/webhook",
        testSendApiPath: "/api/messenger/test-send",
        logsPath: "/message-logs"
      },
      autoReply: {
        supportedChannels: ["WHATSAPP", "MESSENGER"],
        note: "Auto replies can run on configured channels when active rules match inbound messages."
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
