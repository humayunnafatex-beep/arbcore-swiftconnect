import { createCsvResponse, datedExportFilename, rowsToCsv } from "@/lib/csv-export";
import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getContactStatusLabel } from "@/lib/contact-status";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = ["id", "name", "phone", "email", "status", "tags", "createdAt", "updatedAt"];

export async function GET() {
  try {
    const { context } = await requirePermission("contacts.view");
    const contacts = await prisma.contact.findMany({
      where: { companyId: context.company.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        stage: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const rows = contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email ?? "",
      status: getContactStatusLabel(contact.stage),
      tags: contact.tags ?? "",
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }));

    return createCsvResponse(rowsToCsv(headers, rows), datedExportFilename("arbcore-contacts"));
  } catch (error) {
    return handleApiError(error);
  }
}
