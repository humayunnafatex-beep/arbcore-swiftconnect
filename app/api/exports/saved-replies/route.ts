import { createCsvResponse, datedExportFilename, rowsToCsv } from "@/lib/csv-export";
import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = ["title", "category", "shortcut", "channel", "body", "status", "createdAt", "updatedAt"];

export async function GET() {
  try {
    const { context } = await requirePermission("savedReplies.view");
    const replies = await prisma.savedReply.findMany({
      where: { companyId: context.company.id },
      orderBy: { updatedAt: "desc" },
      select: {
        title: true,
        category: true,
        shortcut: true,
        channel: true,
        body: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createCsvResponse(rowsToCsv(headers, replies), datedExportFilename("arbcore-saved-replies"));
  } catch (error) {
    return handleApiError(error);
  }
}
