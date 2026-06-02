import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { isStrictProviderWebhookRouting } from "@/lib/provider-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderField = "whatsappPhoneNumberId" | "messengerPageId";

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

    const whatsappDuplicates = findDuplicates(companies, "whatsappPhoneNumberId");
    const messengerDuplicates = findDuplicates(companies, "messengerPageId");
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
        whatsappProviderIdsPresent: companies.filter((company) => hasValue(company.whatsappPhoneNumberId)).length,
        messengerProviderIdsPresent: companies.filter((company) => hasValue(company.messengerPageId)).length,
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

function findDuplicates(
  companies: Array<{ id: string; name: string; plan: string; whatsappPhoneNumberId: string; messengerPageId: string }>,
  field: ProviderField
) {
  const grouped = new Map<string, Array<{ id: string; name: string; plan: string }>>();

  for (const company of companies) {
    const providerId = company[field].trim();
    if (!providerId) continue;

    const workspaces = grouped.get(providerId) ?? [];
    workspaces.push({
      id: company.id,
      name: company.name,
      plan: company.plan
    });
    grouped.set(providerId, workspaces);
  }

  return Array.from(grouped.entries())
    .filter(([, workspaces]) => workspaces.length > 1)
    .map(([providerId, workspaces]) => ({
      providerIdMasked: maskProviderId(providerId),
      workspaceCount: workspaces.length,
      workspaces
    }));
}

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function maskProviderId(value: string) {
  const trimmed = value.trim();

  if (trimmed.length <= 8) {
    return "configured";
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}
