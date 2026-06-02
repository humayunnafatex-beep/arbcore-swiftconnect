import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { isStrictProviderWebhookRouting } from "@/lib/provider-routing";

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
    const strictProviderRouting = isStrictProviderWebhookRouting();
    const [duplicateWhatsappProviderIds, duplicateMessengerProviderIds] = await Promise.all([
      hasDuplicateProviderId("whatsappPhoneNumberId"),
      hasDuplicateProviderId("messengerPageId")
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
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function hasDuplicateProviderId(field: "whatsappPhoneNumberId" | "messengerPageId") {
  const companies = await prisma.company.findMany({
    where: { NOT: { [field]: "" } },
    select: { [field]: true }
  });
  const seen = new Set<string>();

  for (const company of companies) {
    const providerId = String(company[field] ?? "").trim();
    if (!providerId) continue;
    if (seen.has(providerId)) return true;
    seen.add(providerId);
  }

  return false;
}
