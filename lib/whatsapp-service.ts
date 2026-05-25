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

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
