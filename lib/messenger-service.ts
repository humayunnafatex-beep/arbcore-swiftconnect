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
}): Promise<{ success: true; providerMessageId?: string } | { success: false; error: string; providerStatus?: number }> {
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
        providerStatus: response.status
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
