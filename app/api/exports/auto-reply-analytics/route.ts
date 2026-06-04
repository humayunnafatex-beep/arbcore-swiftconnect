import { Prisma } from "@prisma/client";
import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { createCsvResponse, datedExportFilename, rowsToCsv } from "@/lib/csv-export";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = [
  "id",
  "ruleName",
  "channel",
  "customerKey",
  "inboundTextPreview",
  "replyPreview",
  "status",
  "providerMessageId",
  "errorMessage",
  "createdAt"
];

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("autoReply.view");
    const { searchParams } = new URL(request.url);
    const channel = parseChannel(searchParams.get("channel"));
    const days = parseDays(searchParams.get("days"));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: Prisma.AutoReplyEventWhereInput = {
      companyId: context.company.id,
      createdAt: { gte: since },
      ...(channel === "ALL" ? {} : { channel })
    };

    const events = await prisma.autoReplyEvent.findMany({
      where,
      take: 5000,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ruleName: true,
        channel: true,
        customerKey: true,
        inboundTextPreview: true,
        replyPreview: true,
        status: true,
        providerMessageId: true,
        errorMessage: true,
        createdAt: true
      }
    });

    const rows = events.map((event) => ({
      id: event.id,
      ruleName: event.ruleName,
      channel: event.channel,
      customerKey: event.customerKey,
      inboundTextPreview: truncate(event.inboundTextPreview, 500),
      replyPreview: truncate(event.replyPreview, 500),
      status: event.status,
      providerMessageId: event.providerMessageId,
      errorMessage: truncate(event.errorMessage, 500),
      createdAt: event.createdAt
    }));

    return createCsvResponse(rowsToCsv(headers, rows), datedExportFilename("arbcore-auto-reply-analytics"));
  } catch (error) {
    return handleApiError(error);
  }
}

function parseChannel(value: string | null) {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "WHATSAPP" || normalized === "MESSENGER" || normalized === "ALL") {
    return normalized;
  }

  return "ALL";
}

function parseDays(value: string | null) {
  const parsed = Number(value ?? 30);
  if (parsed === 7 || parsed === 30 || parsed === 90) {
    return parsed;
  }

  return 30;
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}
