import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { hasDuplicateProviderId } from "@/lib/provider-id-validation";
import { isStrictProviderWebhookRouting } from "@/lib/provider-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WHATSAPP_WEBHOOK_PATH = "/api/whatsapp/webhook" as const;
const MESSENGER_WEBHOOK_PATH = "/api/messenger/webhook" as const;

export async function GET() {
  try {
    const { context } = await requirePermission("settings.view");
    const { company } = context;
    const warnings: Array<{ module: string; message: string }> = [];

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
    const strictProviderRouting = isStrictProviderWebhookRouting();
    const [duplicateWhatsappProviderIds, duplicateMessengerProviderIds] = await Promise.all([
      safeHasDuplicateProviderId("whatsappPhoneNumberId", warnings),
      safeHasDuplicateProviderId("messengerPageId", warnings)
    ]);
    const duplicateProviderIdsDetected = duplicateWhatsappProviderIds || duplicateMessengerProviderIds;

    return ok({
      whatsapp: {
        readyForOutbound: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
        readyForWebhook: Boolean(company.whatsappVerifyToken && (company.whatsappWebhookUrl || WHATSAPP_WEBHOOK_PATH)),
        missing: whatsappMissing,
        webhookPath: WHATSAPP_WEBHOOK_PATH,
        webhookUrl: company.whatsappWebhookUrl || null
      },
      messenger: {
        pageIdPresent: Boolean(company.messengerPageId),
        pageAccessTokenPresent: Boolean(company.messengerPageAccessToken),
        verifyTokenPresent: Boolean(company.messengerVerifyToken),
        webhookUrlPresent: Boolean(company.messengerWebhookUrl),
        readyForOutbound: Boolean(company.messengerPageId && company.messengerPageAccessToken),
        readyForWebhook: Boolean(company.messengerVerifyToken && (company.messengerWebhookUrl || MESSENGER_WEBHOOK_PATH)),
        missing: messengerMissing,
        webhookPath: MESSENGER_WEBHOOK_PATH,
        webhookUrl: company.messengerWebhookUrl || null
      },
      providerRouting: {
        strict: strictProviderRouting,
        duplicateProviderIdsDetected,
        message: strictProviderRouting
          ? "Strict routing is on. Unmatched provider webhooks are not processed into default workspace."
          : "Beta fallback is active. Unmatched provider webhooks may route to default workspace.",
        warning: duplicateProviderIdsDetected
          ? "Provider ID duplicate detected. Check Admin Provider Diagnostics before enabling strict routing."
          : null
      },
      warnings
    });
  } catch (error) {
    console.error("Channel diagnostics route failed:", sanitizeDiagnosticsError(error));
    return handleApiError(error);
  }
}

async function safeHasDuplicateProviderId(
  field: "whatsappPhoneNumberId" | "messengerPageId",
  warnings: Array<{ module: string; message: string }>
) {
  try {
    return await hasDuplicateProviderId(field);
  } catch (error) {
    console.error("Channel diagnostics duplicate provider check failed:", {
      field,
      error: sanitizeDiagnosticsError(error)
    });
    warnings.push({
      module: "providerRouting",
      message: "Provider duplicate ID check is temporarily unavailable. Review production migrations before enabling strict provider routing."
    });
    return false;
  }
}

function sanitizeDiagnosticsError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return { message: "Unknown diagnostics error." };
}
