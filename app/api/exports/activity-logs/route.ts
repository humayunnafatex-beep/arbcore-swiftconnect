import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { createCsvResponse, datedExportFilename, rowsToCsv } from "@/lib/csv-export";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = ["createdAt", "actorName", "actorEmail", "actorRole", "action", "entityType", "entityLabel", "summary", "metadataSummary"];

export async function GET() {
  try {
    const { context } = await requirePermission("activity.view");
    const logs = await prisma.activityLog.findMany({
      where: { companyId: context.company.id },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        createdAt: true,
        actorName: true,
        actorEmail: true,
        actorRole: true,
        action: true,
        entityType: true,
        entityLabel: true,
        summary: true,
        metadataSummary: true
      }
    });

    return createCsvResponse(rowsToCsv(headers, logs), datedExportFilename("arbcore-activity-logs"));
  } catch (error) {
    return handleApiError(error);
  }
}
