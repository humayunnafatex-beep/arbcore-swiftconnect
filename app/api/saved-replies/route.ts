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
  try {
    await prisma.$transaction(async (tx) => {
      const existingCount = await tx.savedReply.count({ where: { companyId } });
      if (existingCount > 0) return;

      await tx.savedReply.createMany({
        data: safeDefaultFootwearSavedReplies.map((reply) => ({
          companyId,
          ...reply
        }))
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return;
    }
    throw error;
  }
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

const safeDefaultFootwearSavedReplies = [
  {
    title: "Greeting",
    category: "GREETING",
    shortcut: "greeting",
    channel: "ALL",
    status: "ACTIVE",
    body: "\u0986\u09b8\u09b8\u09be\u09b2\u09be\u09ae\u09c1 \u0986\u09b2\u09be\u0987\u0995\u09c1\u09ae\u0964 Welzz Stride-\u098f \u0986\u09aa\u09a8\u09be\u0995\u09c7 \u09b8\u09cd\u09ac\u09be\u0997\u09a4\u09ae\u0964 \u0986\u09aa\u09a8\u09bf \u0995\u09cb\u09a8 \u09ae\u09a1\u09c7\u09b2/\u09b8\u09be\u0987\u099c \u09b8\u09ae\u09cd\u09aa\u09b0\u09cd\u0995\u09c7 \u099c\u09be\u09a8\u09a4\u09c7 \u099a\u09be\u09a8?"
  },
  {
    title: "Price Ask",
    category: "PRICE_SIZE",
    shortcut: "price",
    channel: "ALL",
    status: "ACTIVE",
    body: "\u099c\u09c1\u09a4\u09be\u09b0 \u09a6\u09be\u09ae \u09ae\u09a1\u09c7\u09b2 \u0985\u09a8\u09c1\u09af\u09be\u09df\u09c0 \u09ad\u09bf\u09a8\u09cd\u09a8 \u09b9\u09df\u0964 \u0986\u09aa\u09a8\u09bf \u0995\u09cb\u09a8 \u09ae\u09a1\u09c7\u09b2\u09c7\u09b0 \u09a6\u09be\u09ae \u099c\u09be\u09a8\u09a4\u09c7 \u099a\u09be\u09a8? \u099a\u09be\u0987\u09b2\u09c7 \u0986\u09ae\u09b0\u09be available models with price share \u0995\u09b0\u09a4\u09c7 \u09aa\u09be\u09b0\u09bf\u0964"
  },
  {
    title: "Size Ask",
    category: "PRICE_SIZE",
    shortcut: "size",
    channel: "ALL",
    status: "ACTIVE",
    body: "\u09b8\u09be\u0987\u099c \u09b8\u09be\u09a7\u09be\u09b0\u09a3\u09a4 40-44 \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4 available \u09a5\u09be\u0995\u09c7, stock \u0985\u09a8\u09c1\u09af\u09be\u09df\u09c0\u0964 \u0986\u09aa\u09a8\u09be\u09b0 regular shoe size \u0995\u09a4?"
  },
  {
    title: "COD",
    category: "COD_DELIVERY",
    shortcut: "cod",
    channel: "ALL",
    status: "ACTIVE",
    body: "Cash on Delivery available \u0986\u099b\u09c7 eligible location-\u098f\u0964 Order confirm \u0995\u09b0\u09a4\u09c7 \u09a8\u09be\u09ae, \u09ab\u09cb\u09a8 \u09a8\u09ae\u09cd\u09ac\u09b0, \u09a0\u09bf\u0995\u09be\u09a8\u09be, \u09ae\u09a1\u09c7\u09b2, \u09b8\u09be\u0987\u099c \u098f\u09ac\u0982 \u0995\u09be\u09b2\u09be\u09b0 \u09a6\u09bf\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964"
  },
  {
    title: "Delivery",
    category: "COD_DELIVERY",
    shortcut: "delivery",
    channel: "ALL",
    status: "ACTIVE",
    body: "\u09a2\u09be\u0995\u09be\u09b0 \u09ad\u09bf\u09a4\u09b0\u09c7 \u09b8\u09be\u09a7\u09be\u09b0\u09a3\u09a4 1-2 working days \u098f\u09ac\u0982 \u09a2\u09be\u0995\u09be\u09b0 \u09ac\u09be\u0987\u09b0\u09c7 2-4 working days \u09b8\u09ae\u09df \u09b2\u09be\u0997\u09c7\u0964 Delivery charge location \u0985\u09a8\u09c1\u09af\u09be\u09df\u09c0 confirm \u0995\u09b0\u09be \u09b9\u09ac\u09c7\u0964"
  },
  {
    title: "Exchange",
    category: "EXCHANGE_POLICY",
    shortcut: "exchange",
    channel: "ALL",
    status: "ACTIVE",
    body: "15 days exchange facility \u0986\u099b\u09c7, \u09a4\u09ac\u09c7 product unused, clean \u098f\u09ac\u0982 original condition-\u098f \u09a5\u09be\u0995\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964 Used \u09ac\u09be damaged product exchange \u0995\u09b0\u09be \u09af\u09be\u09ac\u09c7 \u09a8\u09be\u0964"
  },
  {
    title: "Out of Stock",
    category: "STOCK",
    shortcut: "stock",
    channel: "ALL",
    status: "ACTIVE",
    body: "\u09a6\u09c1\u0983\u0996\u09bf\u09a4, \u098f\u0987 \u09ae\u09a1\u09c7\u09b2/\u09b8\u09be\u0987\u099c\u099f\u09bf \u098f\u0996\u09a8 stock out \u09b9\u09a4\u09c7 \u09aa\u09be\u09b0\u09c7\u0964 \u099a\u09be\u0987\u09b2\u09c7 \u0986\u09ae\u09b0\u09be similar available option suggest \u0995\u09b0\u09a4\u09c7 \u09aa\u09be\u09b0\u09bf\u0964"
  },
  {
    title: "Human Handoff",
    category: "HUMAN_HANDOFF",
    shortcut: "handoff",
    channel: "ALL",
    status: "ACTIVE",
    body: "\u098f\u0987 \u09ac\u09bf\u09b7\u09df\u099f\u09bf \u0986\u09ae\u09be\u09a6\u09c7\u09b0 support team manually check \u0995\u09b0\u09ac\u09c7\u0964 \u0985\u09a8\u09c1\u0997\u09cd\u09b0\u09b9 \u0995\u09b0\u09c7 order details/\u09b8\u09ae\u09b8\u09cd\u09af\u09be\u09b0 \u099b\u09ac\u09bf \u09a6\u09bf\u09b2\u09c7 \u0986\u09ae\u09b0\u09be \u09a6\u09cd\u09b0\u09c1\u09a4 \u09b8\u09be\u09b9\u09be\u09af\u09cd\u09af \u0995\u09b0\u09a4\u09c7 \u09aa\u09be\u09b0\u09ac\u0964"
  }
];
