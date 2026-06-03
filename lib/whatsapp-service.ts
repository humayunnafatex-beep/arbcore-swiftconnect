import crypto from "node:crypto";

export type WhatsAppComponent = {
  type: string;
  parameters?: Array<Record<string, unknown>>;
};

export type ParsedWhatsAppEvent = {
  messages: Array<{
    from: string;
    id: string;
    timestamp?: string;
    type: string;
    text?: string;
  }>;
  statuses: Array<{
    id: string;
    status: "sent" | "delivered" | "read" | "failed" | string;
    timestamp?: string;
    recipientId?: string;
    errorMessage?: string;
  }>;
  phoneNumberId?: string;
};

export class WhatsAppServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export type SafeWhatsAppProviderError = {
  message?: string;
  type?: string;
  code?: number | string;
  subcode?: number | string;
  fbtraceId?: string;
};

export type WhatsAppSendResult =
  | { success: true; providerMessageId?: string }
  | { success: false; error: string; providerStatus?: number; providerError?: SafeWhatsAppProviderError };

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function getWhatsAppConfigStatus() {
  return {
    configured: isWhatsAppConfigured(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
    hasAccessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    hasVerifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    hasAppSecret: Boolean(process.env.WHATSAPP_APP_SECRET)
  };
}

export async function sendTextMessage(to: string, body: string) {
  return sendWhatsAppMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizePhone(to),
    type: "text",
    text: { preview_url: false, body }
  });
}

export async function sendWhatsAppTextMessage({
  phoneNumberId,
  accessToken,
  to,
  body,
  apiVersion = "v20.0"
}: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
  apiVersion?: string;
}): Promise<WhatsAppSendResult> {
  const normalizedPhone = normalizePhone(to);

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp Cloud API is not configured." };
  }

  if (!/^\d{8,16}$/.test(normalizedPhone) || !body.trim()) {
    return { success: false, error: "Please check phone number and message." };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "text",
        text: { body: body.trim() }
      })
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerError = getSafeMetaError(responseBody);
      return {
        success: false,
        error: "WhatsApp provider rejected the message.",
        providerStatus: response.status,
        providerError
      };
    }

    return {
      success: true,
      providerMessageId: getProviderMessageId(responseBody)
    };
  } catch {
    return { success: false, error: "WhatsApp provider rejected the message." };
  }
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode = "en_US",
  components?: WhatsAppComponent[]
) {
  return sendWhatsAppMessage({
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components?.length ? { components } : {})
    }
  });
}

export async function sendMediaMessage(to: string, mediaUrl: string, mediaType: "image" | "video" | "audio" | "document") {
  return sendWhatsAppMessage({
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: mediaType,
    [mediaType]: { link: mediaUrl }
  });
}

export function verifyWebhook(mode: string | null, token: string | null, challenge: string | null) {
  if (mode !== "subscribe" || !challenge || !process.env.WHATSAPP_VERIFY_TOKEN || token !== process.env.WHATSAPP_VERIFY_TOKEN) {
    throw new WhatsAppServiceError("WhatsApp webhook verification failed.", 403);
  }

  return challenge;
}

export function parseWebhookEvent(payload: unknown): ParsedWhatsAppEvent {
  const event: ParsedWhatsAppEvent = { messages: [], statuses: [] };
  const entries = isRecord(payload) && Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    const changes = isRecord(entry) && Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = isRecord(change) && isRecord(change.value) ? change.value : {};
      const metadata = isRecord(value.metadata) ? value.metadata : {};
      if (typeof metadata.phone_number_id === "string") event.phoneNumberId = metadata.phone_number_id;

      if (Array.isArray(value.messages)) {
        for (const message of value.messages) {
          if (!isRecord(message) || typeof message.from !== "string" || typeof message.id !== "string") continue;
          const text = isRecord(message.text) && typeof message.text.body === "string" ? message.text.body : undefined;
          event.messages.push({
            from: message.from,
            id: message.id,
            timestamp: typeof message.timestamp === "string" ? message.timestamp : undefined,
            type: typeof message.type === "string" ? message.type : "unknown",
            text
          });
        }
      }

      if (Array.isArray(value.statuses)) {
        for (const status of value.statuses) {
          if (!isRecord(status) || typeof status.id !== "string" || typeof status.status !== "string") continue;
          const errors = Array.isArray(status.errors) ? status.errors : [];
          const firstError = errors.find(isRecord);
          event.statuses.push({
            id: status.id,
            status: status.status,
            timestamp: typeof status.timestamp === "string" ? status.timestamp : undefined,
            recipientId: typeof status.recipient_id === "string" ? status.recipient_id : undefined,
            errorMessage: firstError && typeof firstError.message === "string" ? firstError.message : undefined
          });
        }
      }
    }
  }

  return event;
}

export function validateSignature(rawBody: string, signature: string | null) {
  if (!process.env.WHATSAPP_APP_SECRET) {
    return true;
  }

  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${crypto.createHmac("sha256", process.env.WHATSAPP_APP_SECRET).update(rawBody).digest("hex")}`;
  return safeCompare(expected, signature);
}

async function sendWhatsAppMessage(payload: Record<string, unknown>) {
  if (!isWhatsAppConfigured()) {
    throw new WhatsAppServiceError("WhatsApp Cloud API is not configured.", 400);
  }

  const phone = String(payload.to ?? "");
  if (!/^\d{8,16}$/.test(phone)) {
    throw new WhatsAppServiceError("Enter a valid recipient phone number in international format without plus sign.", 422);
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = isRecord(body) && isRecord(body.error) && typeof body.error.message === "string"
      ? body.error.message
      : "WhatsApp Cloud API request failed.";
    throw new WhatsAppServiceError(message, response.status, body);
  }

  return body as { messages?: Array<{ id: string }> };
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function getProviderMessageId(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.messages)) {
    return undefined;
  }

  const first = payload.messages[0];
  return isRecord(first) && typeof first.id === "string" ? first.id : undefined;
}

export function getSafeWhatsAppProviderErrorSummary(providerError?: SafeWhatsAppProviderError) {
  if (!providerError) {
    return "WhatsApp provider rejected the message.";
  }

  const parts = [
    providerError.message,
    providerError.type ? `type ${providerError.type}` : null,
    providerError.code !== undefined ? `code ${providerError.code}` : null,
    providerError.subcode !== undefined ? `subcode ${providerError.subcode}` : null,
    providerError.fbtraceId ? `fbtrace ${providerError.fbtraceId}` : null
  ].filter(Boolean);

  return parts.length ? `WhatsApp provider rejected the message: ${parts.join("; ")}.` : "WhatsApp provider rejected the message.";
}

function getSafeMetaError(payload: unknown): SafeWhatsAppProviderError | undefined {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return undefined;
  }

  const error = payload.error;
  return {
    message: getString(error.message),
    type: getString(error.type),
    code: getStringOrNumber(error.code),
    subcode: getStringOrNumber(error.error_subcode),
    fbtraceId: getString(error.fbtrace_id)
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getStringOrNumber(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
