export const savedReplyCategories = [
  "GENERAL",
  "PRICE",
  "SIZE",
  "DELIVERY",
  "COD",
  "ORDER",
  "PAYMENT",
  "SUPPORT",
  "COMPLAINT",
  "FOLLOW_UP"
] as const;

export const savedReplyChannels = ["ALL", "WHATSAPP", "MESSENGER"] as const;
export const savedReplyStatuses = ["ACTIVE", "ARCHIVED"] as const;

export type SavedReplyCategory = (typeof savedReplyCategories)[number];
export type SavedReplyChannel = (typeof savedReplyChannels)[number];
export type SavedReplyStatus = (typeof savedReplyStatuses)[number];

export type SavedReplyInput = {
  title?: unknown;
  category?: unknown;
  body?: unknown;
  shortcut?: unknown;
  channel?: unknown;
  status?: unknown;
};

export function normalizeSavedReplyCategory(value: unknown): SavedReplyCategory {
  const normalized = String(value ?? "GENERAL").trim().toUpperCase();
  return savedReplyCategories.includes(normalized as SavedReplyCategory) ? normalized as SavedReplyCategory : "GENERAL";
}

export function normalizeSavedReplyChannel(value: unknown): SavedReplyChannel {
  const normalized = String(value ?? "ALL").trim().toUpperCase();
  return savedReplyChannels.includes(normalized as SavedReplyChannel) ? normalized as SavedReplyChannel : "ALL";
}

export function normalizeSavedReplyStatus(value: unknown): SavedReplyStatus {
  const normalized = String(value ?? "ACTIVE").trim().toUpperCase();
  return savedReplyStatuses.includes(normalized as SavedReplyStatus) ? normalized as SavedReplyStatus : "ACTIVE";
}

export function normalizeSavedReplyShortcut(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 40);
}

export function validateSavedReplyInput(input: SavedReplyInput, options?: { partial?: boolean }) {
  const partial = options?.partial ?? false;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";

  if (!partial || "title" in input) {
    if (!title) return { success: false as const, error: "Saved reply title is required." };
    if (title.length > 120) return { success: false as const, error: "Saved reply title must be 120 characters or fewer." };
  }

  if (!partial || "body" in input) {
    if (!body) return { success: false as const, error: "Saved reply body is required." };
    if (body.length > 2000) return { success: false as const, error: "Saved reply body must be 2000 characters or fewer." };
  }

  return {
    success: true as const,
    data: {
      ...("title" in input || !partial ? { title } : {}),
      ...("body" in input || !partial ? { body } : {}),
      ...("category" in input || !partial ? { category: normalizeSavedReplyCategory(input.category) } : {}),
      ...("shortcut" in input || !partial ? { shortcut: normalizeSavedReplyShortcut(input.shortcut) } : {}),
      ...("channel" in input || !partial ? { channel: normalizeSavedReplyChannel(input.channel) } : {}),
      ...("status" in input || !partial ? { status: normalizeSavedReplyStatus(input.status) } : {})
    }
  };
}
