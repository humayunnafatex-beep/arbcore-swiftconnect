import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeLogMetadata } from "@/lib/safe-error";

type ActivityInput = {
  companyId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary?: string | null;
  metadataSummary?: string | null;
};

type ChangeSource = Record<string, unknown> | null | undefined;

export async function getSafeActorContext() {
  try {
    const { user } = await getCurrentAuthContext();

    return {
      actorUserId: safeText(user.id, 128),
      actorName: safeText(user.name || "Beta Operator", 120),
      actorEmail: safeText(user.email, 160),
      actorRole: safeText(user.role, 40)
    };
  } catch (error) {
    console.error("Activity actor context failed:", sanitizeLogMetadata(error));

    return {
      actorUserId: "",
      actorName: "Beta Operator",
      actorEmail: "",
      actorRole: ""
    };
  }
}

export async function recordActivity(input: ActivityInput) {
  try {
    const actor = await getSafeActorContext();

    await prisma.activityLog.create({
      data: {
        companyId: input.companyId,
        ...actor,
        action: safeText(input.action, 80),
        entityType: safeText(input.entityType, 80),
        entityId: safeText(input.entityId, 128),
        entityLabel: safeText(input.entityLabel, 180),
        summary: safeText(input.summary, 240),
        metadataSummary: safeText(input.metadataSummary, 300)
      }
    });
  } catch (error) {
    console.error("Activity log write failed:", sanitizeLogMetadata(error));
  }
}

export function formatChangeSummary(before: ChangeSource, after: ChangeSource, fields: string[]) {
  const changes = fields
    .filter((field) => safeComparable(before?.[field]) !== safeComparable(after?.[field]))
    .map((field) => field);

  if (!changes.length) return "No tracked fields changed.";
  return `Updated ${changes.slice(0, 8).join(", ")}${changes.length > 8 ? ", and more" : ""}.`;
}

export function safeActivityLabel(...parts: Array<string | null | undefined>) {
  return safeText(parts.filter(Boolean).join(" - "), 180);
}

function safeText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return "";
  const sanitized = sanitizeLogMetadata(String(value));
  return String(sanitized).replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeComparable(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return "";
  return String(value);
}
