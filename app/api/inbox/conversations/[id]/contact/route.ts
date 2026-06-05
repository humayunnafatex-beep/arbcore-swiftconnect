import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { normalizeContactStatus } from "@/lib/contact-status";
import { prisma } from "@/lib/prisma";
import { normalizeTags } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validConversationChannels = ["WHATSAPP", "MESSENGER"] as const;
const contactCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().nullable(),
  status: z.string().trim().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional().nullable()
});

type ConversationChannel = (typeof validConversationChannels)[number];

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { context } = await requirePermission("contacts.manage");
    const { company } = context;
    const conversation = decodeConversationId(params.id);
    const parsed = contactCreateSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Contact name and optional fields are invalid." },
        { status: 400 }
      );
    }

    if (conversation.channel !== "WHATSAPP") {
      return NextResponse.json(
        {
          success: false,
          error: "Messenger contact linking requires a phone number or future Messenger PSID field."
        },
        { status: 400 }
      );
    }

    const phone = normalizePhoneForContact(conversation.contactKey);
    const duplicate = await findDuplicateContact(company.id, phone);

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `A contact with this phone number already exists: ${duplicate.name}.`
        },
        { status: 409 }
      );
    }

    const input = parsed.data;
    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        name: input.name.trim(),
        phone,
        email: input.email?.trim() || undefined,
        stage: normalizeContactStatus(input.status),
        tags: normalizeTags(input.tags) ?? null,
        segment: "Inbox",
        profileSource: "MANUAL",
        optedIn: true
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        stage: true,
        tags: true,
        whatsappProfileName: true,
        profileSource: true,
        lastReferralSourceType: true,
        lastReferralSourceId: true,
        lastReferralSourceUrl: true,
        lastReferralHeadline: true,
        lastReferralBody: true,
        lastReferralMediaType: true,
        lastReferralImageUrl: true,
        lastReferralVideoUrl: true,
        lastReferralCtwaClid: true,
        lastReferralAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          status: contact.stage,
          tags: contact.tags,
          whatsappProfileName: contact.whatsappProfileName,
          profileSource: contact.profileSource,
          lastReferralSourceType: contact.lastReferralSourceType,
          lastReferralSourceId: contact.lastReferralSourceId,
          lastReferralSourceUrl: contact.lastReferralSourceUrl,
          lastReferralHeadline: contact.lastReferralHeadline,
          lastReferralBody: contact.lastReferralBody,
          lastReferralMediaType: contact.lastReferralMediaType,
          lastReferralImageUrl: contact.lastReferralImageUrl,
          lastReferralVideoUrl: contact.lastReferralVideoUrl,
          lastReferralCtwaClid: contact.lastReferralCtwaClid,
          lastReferralAt: contact.lastReferralAt?.toISOString() ?? null
        }
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A contact with this phone number already exists." },
        { status: 409 }
      );
    }

    console.error("Inbox conversation contact POST error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create contact from conversation." },
      { status: 500 }
    );
  }
}

function decodeConversationId(id: string): { channel: ConversationChannel; contactKey: string } {
  try {
    const parsed = JSON.parse(Buffer.from(id, "base64url").toString("utf8")) as {
      channel?: string;
      contactKey?: string;
    };

    if (!isConversationChannel(parsed.channel) || !parsed.contactKey) {
      throw new Error("Invalid conversation id");
    }

    return {
      channel: parsed.channel,
      contactKey: parsed.contactKey
    };
  } catch {
    throw new ApiError(400, "INVALID_CONVERSATION", "Invalid inbox conversation.");
  }
}

async function findDuplicateContact(companyId: string, phone: string) {
  const candidates = phoneMatchCandidates(phone);
  const contacts = await prisma.contact.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      phone: true
    }
  });

  return contacts.find((contact) => Array.from(phoneMatchCandidates(contact.phone)).some((candidate) => candidates.has(candidate))) ?? null;
}

function isConversationChannel(value: string | undefined): value is ConversationChannel {
  return value === "WHATSAPP" || value === "MESSENGER";
}

function normalizePhoneForContact(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function phoneMatchCandidates(phone: string) {
  const normalized = normalizePhoneForContact(phone);
  const candidates = new Set<string>();
  if (normalized) candidates.add(normalized);

  if (normalized.startsWith("8801") && normalized.length === 13) {
    candidates.add(`0${normalized.slice(3)}`);
  }

  if (normalized.startsWith("01") && normalized.length === 11) {
    candidates.add(`880${normalized.slice(1)}`);
  }

  return candidates;
}
