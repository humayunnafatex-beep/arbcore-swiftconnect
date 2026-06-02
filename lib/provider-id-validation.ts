import { prisma } from "@/lib/prisma";

export type ProviderIdField = "whatsappPhoneNumberId" | "messengerPageId";

export type ProviderIdValidationError = {
  field: ProviderIdField;
  message: string;
};

type ProviderCompany = {
  id: string;
  name: string;
  plan: string;
  whatsappPhoneNumberId: string;
  messengerPageId: string;
};

const providerFieldMessages: Record<ProviderIdField, string> = {
  whatsappPhoneNumberId: "This WhatsApp Phone Number ID is already used by another workspace.",
  messengerPageId: "This Messenger Page ID is already used by another workspace."
};

export function normalizeProviderId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function validateUniqueProviderIdsForCompany({
  companyId,
  whatsappPhoneNumberId,
  messengerPageId
}: {
  companyId: string;
  whatsappPhoneNumberId?: unknown;
  messengerPageId?: unknown;
}) {
  const submittedIds: Array<{ field: ProviderIdField; value: string }> = [
    { field: "whatsappPhoneNumberId", value: normalizeProviderId(whatsappPhoneNumberId) },
    { field: "messengerPageId", value: normalizeProviderId(messengerPageId) }
  ];
  const errors: ProviderIdValidationError[] = [];

  for (const submitted of submittedIds) {
    if (!submitted.value) continue;

    const existingCompany = await prisma.company.findFirst({
      where: {
        id: { not: companyId },
        [submitted.field]: submitted.value
      },
      select: { id: true }
    });

    if (existingCompany) {
      errors.push({
        field: submitted.field,
        message: providerFieldMessages[submitted.field]
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function findDuplicateProviderIds(companies: ProviderCompany[], field: ProviderIdField) {
  const grouped = new Map<string, Array<{ id: string; name: string; plan: string }>>();

  for (const company of companies) {
    const providerId = normalizeProviderId(company[field]);
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

export async function hasDuplicateProviderId(field: ProviderIdField) {
  const companies = await prisma.company.findMany({
    select: {
      whatsappPhoneNumberId: true,
      messengerPageId: true
    }
  });
  const seen = new Set<string>();

  for (const company of companies) {
    const providerId = normalizeProviderId(company[field]);
    if (!providerId) continue;
    if (seen.has(providerId)) return true;
    seen.add(providerId);
  }

  return false;
}

export function hasProviderIdValue(value: unknown) {
  return Boolean(normalizeProviderId(value));
}

export function maskProviderId(value: string) {
  const trimmed = normalizeProviderId(value);

  if (trimmed.length <= 8) {
    return "configured";
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}
