import { MessageDirection, MessageStatus, Prisma } from "@prisma/client";
import { createCsvResponse, datedExportFilename, rowsToCsv } from "@/lib/csv-export";
import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = ["id", "channel", "direction", "status", "phoneOrPsid", "bodyPreview", "providerMessageId", "errorMessage", "createdAt"];
const channels = new Set(["WHATSAPP", "MESSENGER"]);
const directions = new Set<string>(["INBOUND", "OUTBOUND"]);
const statuses = new Set<string>(["QUEUED", "SENT", "DELIVERED", "READ", "FAILED", "RECEIVED", "ATTEMPTED"]);

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("messages.viewLogs");
    const { searchParams } = new URL(request.url);
    const channel = normalizeOption(searchParams.get("channel"), channels);
    const direction = normalizeOption(searchParams.get("direction"), directions) as MessageDirection | undefined;
    const statusParam = normalizeOption(searchParams.get("status"), statuses);
    const search = searchParams.get("search")?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 5000) || 5000, 1), 5000);
    const status = (statusParam === "ATTEMPTED" ? "QUEUED" : statusParam) as MessageStatus | undefined;

    const where: Prisma.MessageLogWhereInput = {
      companyId: context.company.id,
      ...(channel ? { channel } : {}),
      ...(direction ? { direction } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { providerMessageId: { contains: search } },
              { body: { contains: search } },
              { contact: { is: { phone: { contains: search } } } },
              { contact: { is: { name: { contains: search } } } }
            ]
          }
        : {})
    };

    const logs = await prisma.messageLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { contact: { select: { phone: true, name: true } } }
    });

    const rows = logs.map((log) => ({
      id: log.id,
      channel: log.channel,
      direction: log.direction,
      status: log.status,
      phoneOrPsid: log.contact?.phone ?? "",
      bodyPreview: truncate(log.body, 500),
      providerMessageId: log.providerMessageId ?? "",
      errorMessage: truncate(log.errorMessage ?? "", 500),
      createdAt: log.createdAt
    }));

    return createCsvResponse(rowsToCsv(headers, rows), datedExportFilename("arbcore-message-logs"));
  } catch (error) {
    return handleApiError(error);
  }
}

function normalizeOption(value: string | null, allowed: Set<string>) {
  const normalized = value?.trim().toUpperCase();
  return normalized && normalized !== "ALL" && allowed.has(normalized) ? normalized : undefined;
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}
