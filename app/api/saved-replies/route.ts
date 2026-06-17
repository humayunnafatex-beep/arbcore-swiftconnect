import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import {
  normalizeSavedReplyCategory,
  normalizeSavedReplyChannel,
  normalizeSavedReplyStatus,
  validateSavedReplyInput
} from "@/lib/saved-reply-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("savedReplies.view");
    const { company } = context;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim();
    const channel = searchParams.get("channel")?.trim();
    const status = searchParams.get("status")?.trim();
    const search = searchParams.get("search")?.trim();
    const limit = parseLimit(searchParams.get("limit"));
    const where = buildWhere({
      companyId: company.id,
      category,
      channel,
      status,
      search
    });

    await seedDefaultSavedRepliesIfEmpty(company.id);

    const replies = await prisma.savedReply.findMany({
      where,
      take: limit,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    });

    return NextResponse.json({ success: true, data: { replies } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Saved replies GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load saved replies." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { context } = await requirePermission("savedReplies.manage");
    const { company } = context;
    const validation = validateSavedReplyInput(await request.json().catch(() => ({})));

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const reply = await prisma.savedReply.create({
      data: {
        companyId: company.id,
        title: validation.data.title ?? "",
        category: validation.data.category ?? "GENERAL",
        body: validation.data.body ?? "",
        shortcut: validation.data.shortcut ?? "",
        channel: validation.data.channel ?? "ALL",
        status: validation.data.status ?? "ACTIVE"
      }
    });

    await recordActivity({
      companyId: company.id,
      action: "SAVED_REPLY_CREATED",
      entityType: "SAVED_REPLY",
      entityId: reply.id,
      entityLabel: safeActivityLabel(reply.title, reply.shortcut),
      summary: "Created saved reply.",
      metadataSummary: `Category: ${reply.category}; Channel: ${reply.channel}; Status: ${reply.status}`
    });

    return NextResponse.json({ success: true, data: { reply } }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Saved replies POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create saved reply." }, { status: 500 });
  }
}

function buildWhere({
  companyId,
  category,
  channel,
  status,
  search
}: {
  companyId: string;
  category?: string;
  channel?: string;
  status?: string;
  search?: string;
}): Prisma.SavedReplyWhereInput {
  const normalizedChannel = channel ? normalizeSavedReplyChannel(channel) : "ALL";

  return {
    companyId,
    ...(category && category.toUpperCase() !== "ALL" ? { category: normalizeSavedReplyCategory(category) } : {}),
    ...(status && status.toUpperCase() !== "ALL" ? { status: normalizeSavedReplyStatus(status) } : {}),
    ...(channel && channel.toUpperCase() !== "ALL"
      ? { channel: { in: ["ALL", normalizedChannel] } }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { body: { contains: search, mode: "insensitive" } },
            { shortcut: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 500);
}

async function seedDefaultSavedRepliesIfEmpty(companyId: string) {
  const existingCount = await prisma.savedReply.count({ where: { companyId } });
  if (existingCount > 0) return;

  await prisma.savedReply.createMany({
    data: defaultFootwearSavedReplies.map((reply) => ({
      companyId,
      ...reply
    }))
  });
}

const defaultFootwearSavedReplies = [
  {
    title: "Greeting",
    category: "GREETING",
    shortcut: "greeting",
    channel: "ALL",
    status: "ACTIVE",
    body: "আসসালামু আলাইকুম। Welzz Stride-এ আপনাকে স্বাগতম। আপনি কোন মডেল/সাইজ সম্পর্কে জানতে চান?"
  },
  {
    title: "Price Ask",
    category: "PRICE_SIZE",
    shortcut: "price",
    channel: "ALL",
    status: "ACTIVE",
    body: "জুতার দাম মডেল অনুযায়ী ভিন্ন হয়। আপনি কোন মডেলের দাম জানতে চান? চাইলে আমরা available models with price share করতে পারি।"
  },
  {
    title: "Size Ask",
    category: "PRICE_SIZE",
    shortcut: "size",
    channel: "ALL",
    status: "ACTIVE",
    body: "সাইজ সাধারণত 40-44 পর্যন্ত available থাকে, stock অনুযায়ী। আপনার regular shoe size কত?"
  },
  {
    title: "COD",
    category: "COD_DELIVERY",
    shortcut: "cod",
    channel: "ALL",
    status: "ACTIVE",
    body: "Cash on Delivery available আছে eligible location-এ। Order confirm করতে নাম, ফোন নম্বর, ঠিকানা, মডেল, সাইজ এবং কালার দিতে হবে।"
  },
  {
    title: "Delivery",
    category: "COD_DELIVERY",
    shortcut: "delivery",
    channel: "ALL",
    status: "ACTIVE",
    body: "ঢাকার ভিতরে সাধারণত 1-2 working days এবং ঢাকার বাইরে 2-4 working days সময় লাগে। Delivery charge location অনুযায়ী confirm করা হবে।"
  },
  {
    title: "Exchange",
    category: "EXCHANGE_POLICY",
    shortcut: "exchange",
    channel: "ALL",
    status: "ACTIVE",
    body: "15 days exchange facility আছে, তবে product unused, clean এবং original condition-এ থাকতে হবে। Used বা damaged product exchange করা যাবে না।"
  },
  {
    title: "Out of Stock",
    category: "STOCK",
    shortcut: "stock",
    channel: "ALL",
    status: "ACTIVE",
    body: "দুঃখিত, এই মডেল/সাইজটি এখন stock out হতে পারে। চাইলে আমরা similar available option suggest করতে পারি।"
  },
  {
    title: "Human Handoff",
    category: "HUMAN_HANDOFF",
    shortcut: "handoff",
    channel: "ALL",
    status: "ACTIVE",
    body: "এই বিষয়টি আমাদের support team manually check করবে। অনুগ্রহ করে order details/সমস্যার ছবি দিলে আমরা দ্রুত সাহায্য করতে পারব।"
  }
];
