export type SafeMessengerProviderError = {
  message?: string;
  type?: string;
  code?: number | string;
  subcode?: number | string;
  fbtraceId?: string;
};

export type MessengerSendResult =
  | { success: true; providerMessageId?: string }
  | { success: false; error: string; providerStatus?: number; providerError?: SafeMessengerProviderError };

export async function sendMessengerTextMessage({
  pageAccessToken,
  recipientId,
  body,
  apiVersion = "v20.0"
}: {
  pageAccessToken: string;
  recipientId: string;
  body: string;
  apiVersion?: string;
}): Promise<MessengerSendResult> {
  const normalizedRecipientId = recipientId.trim();
  const normalizedBody = body.trim();

  if (!pageAccessToken || !normalizedRecipientId) {
    return { success: false, error: "Messenger Page API is not configured." };
  }

  if (!normalizedBody) {
    return { success: false, error: "Please check recipient PSID and message." };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/me/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipient: { id: normalizedRecipientId },
        message: { text: normalizedBody }
      })
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: "Messenger provider rejected the message.",
        providerStatus: response.status,
        providerError: getSafeMetaError(responseBody)
      };
    }

    return {
      success: true,
      providerMessageId: getProviderMessageId(responseBody)
    };
  } catch {
    return { success: false, error: "Messenger provider rejected the message." };
  }
}

export function getSafeMessengerProviderErrorSummary(providerError?: SafeMessengerProviderError) {
  if (!providerError) {
    return "Messenger provider rejected the message.";
  }

  const parts = [
    providerError.message,
    providerError.type ? `type ${providerError.type}` : null,
    providerError.code !== undefined ? `code ${providerError.code}` : null,
    providerError.subcode !== undefined ? `subcode ${providerError.subcode}` : null,
    providerError.fbtraceId ? `fbtrace ${providerError.fbtraceId}` : null
  ].filter(Boolean);

  return parts.length ? `Messenger provider rejected the message: ${parts.join("; ")}.` : "Messenger provider rejected the message.";
}

function getProviderMessageId(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  if (typeof payload.message_id === "string") {
    return payload.message_id;
  }

  if (typeof payload.mid === "string") {
    return payload.mid;
  }

  return undefined;
}

function getSafeMetaError(payload: unknown): SafeMessengerProviderError | undefined {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
