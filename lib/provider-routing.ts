import type { Company } from "@prisma/client";
import { getCurrentCompany } from "@/lib/current-company";
import { prisma } from "@/lib/prisma";

export type ProviderRoutingChannel = "WHATSAPP" | "MESSENGER";
export type ProviderRoutedBy =
  | "WHATSAPP_PHONE_NUMBER_ID"
  | "WHATSAPP_BUSINESS_ACCOUNT_ID"
  | "MESSENGER_PAGE_ID"
  | "BETA_FALLBACK";

export type WhatsAppProviderIds = {
  phoneNumberId?: string;
  businessAccountId?: string;
  from?: string;
};

export type MessengerProviderIds = {
  pageId?: string;
  senderId?: string;
};

export type ProviderRoutingResult = {
  company: Company;
  routedBy: ProviderRoutedBy;
  providerIds: WhatsAppProviderIds | MessengerProviderIds;
};

export function extractWhatsAppProviderIds(payload: unknown): WhatsAppProviderIds {
  const ids: WhatsAppProviderIds = {};
  const entries = getArray(getRecord(payload)?.entry);

  for (const entry of entries) {
    const entryRecord = getRecord(entry);
    if (!ids.businessAccountId && typeof entryRecord?.id === "string") {
      ids.businessAccountId = entryRecord.id;
    }

    for (const change of getArray(entryRecord?.changes)) {
      const value = getRecord(getRecord(change)?.value);
      const metadata = getRecord(value?.metadata);
      if (!ids.phoneNumberId && typeof metadata?.phone_number_id === "string") {
        ids.phoneNumberId = metadata.phone_number_id;
      }

      for (const message of getArray(value?.messages)) {
        const messageRecord = getRecord(message);
        if (!ids.from && typeof messageRecord?.from === "string") {
          ids.from = messageRecord.from;
        }
      }
    }
  }

  return ids;
}

export async function findCompanyByWhatsAppProvider(payload: unknown) {
  const providerIds = extractWhatsAppProviderIds(payload);

  if (providerIds.phoneNumberId) {
    const company = await prisma.company.findFirst({
      where: { whatsappPhoneNumberId: providerIds.phoneNumberId }
    });

    if (company) {
      return {
        company,
        routedBy: "WHATSAPP_PHONE_NUMBER_ID" as const,
        providerIds
      };
    }
  }

  // No Company.whatsappBusinessAccountId field exists yet. Keep this extracted
  // value for diagnostics and future hardening without changing the schema.
  return {
    company: null,
    routedBy: null,
    providerIds
  };
}

export function extractMessengerProviderIds(payload: unknown): MessengerProviderIds {
  const ids: MessengerProviderIds = {};
  const entries = getArray(getRecord(payload)?.entry);

  for (const entry of entries) {
    const entryRecord = getRecord(entry);
    if (!ids.pageId && typeof entryRecord?.id === "string") {
      ids.pageId = entryRecord.id;
    }

    for (const event of getArray(entryRecord?.messaging)) {
      const sender = getRecord(getRecord(event)?.sender);
      if (!ids.senderId && typeof sender?.id === "string") {
        ids.senderId = sender.id;
      }
    }
  }

  return ids;
}

export async function findCompanyByMessengerProvider(payload: unknown) {
  const providerIds = extractMessengerProviderIds(payload);

  if (providerIds.pageId) {
    const company = await prisma.company.findFirst({
      where: { messengerPageId: providerIds.pageId }
    });

    if (company) {
      return {
        company,
        routedBy: "MESSENGER_PAGE_ID" as const,
        providerIds
      };
    }
  }

  return {
    company: null,
    routedBy: null,
    providerIds
  };
}

export async function getCompanyForProviderWebhook({
  channel,
  payload
}: {
  channel: ProviderRoutingChannel;
  payload: unknown;
}): Promise<ProviderRoutingResult> {
  const routed = channel === "WHATSAPP"
    ? await findCompanyByWhatsAppProvider(payload)
    : await findCompanyByMessengerProvider(payload);

  if (routed.company && routed.routedBy) {
    return {
      company: routed.company,
      routedBy: routed.routedBy,
      providerIds: routed.providerIds
    };
  }

  // Beta-only fallback preserves the existing single-company webhook behavior.
  // Production multi-client mode should require a provider match before processing.
  return {
    company: await getCurrentCompany(),
    routedBy: "BETA_FALLBACK",
    providerIds: routed.providerIds
  };
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}
