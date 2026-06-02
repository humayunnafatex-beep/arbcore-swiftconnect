import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { findDuplicateProviderIds, hasProviderIdValue } from "@/lib/provider-id-validation";
import { isStrictProviderWebhookRouting } from "@/lib/provider-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("settings.view");

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        plan: true,
        whatsappPhoneNumberId: true,
        messengerPageId: true
      }
    });

    const whatsappDuplicates = findDuplicateProviderIds(companies, "whatsappPhoneNumberId");
    const messengerDuplicates = findDuplicateProviderIds(companies, "messengerPageId");
    const strictProviderRouting = isStrictProviderWebhookRouting();
    const warnings = [
      whatsappDuplicates.length || messengerDuplicates.length
        ? "Do not enable strict provider routing until duplicate provider IDs are resolved."
        : null,
      "Empty provider IDs are ignored.",
      strictProviderRouting && (whatsappDuplicates.length || messengerDuplicates.length)
        ? "Strict provider routing is on while duplicate provider IDs exist. Review routing immediately."
        : null
    ].filter(Boolean) as string[];

    return ok({
      strictProviderRouting,
      summary: {
        workspaceCount: companies.length,
        whatsappProviderIdsPresent: companies.filter((company) => hasProviderIdValue(company.whatsappPhoneNumberId)).length,
        messengerProviderIdsPresent: companies.filter((company) => hasProviderIdValue(company.messengerPageId)).length,
        duplicateWhatsappPhoneNumberIds: whatsappDuplicates.length,
        duplicateMessengerPageIds: messengerDuplicates.length
      },
      duplicates: {
        whatsappPhoneNumberIds: whatsappDuplicates,
        messengerPageIds: messengerDuplicates
      },
      warnings
    });
  } catch (error) {
    return handleApiError(error);
  }
}
