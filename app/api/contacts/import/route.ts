import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ApiError, handleApiError, ok } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema, normalizeTags } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonImportSchema = z.object({
  rows: z.array(contactCreateSchema).min(1)
});

type RawRow = Record<string, unknown>;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const rows = contentType.includes("application/json")
      ? await parseJsonRows(request)
      : await parseFileRows(request);

    if (rows.length === 0) {
      throw new ApiError(422, "EMPTY_IMPORT", "The import file did not contain any contact rows.");
    }

    const { company } = await getCurrentAuthContext();
    const companyId = company.id;
    const validRows = rows.map((row) => contactCreateSchema.parse(normalizeImportRow(row)));
    const results = [];
    let skipped = 0;

    for (const row of validRows) {
      const existing = await prisma.contact.findUnique({ where: { phone: row.phone } });
      const keepUnsubscribed = existing?.companyId === companyId && existing.doNotContact;

      if (existing && existing.companyId !== companyId) {
        skipped += 1;
        continue;
      }

      const contact = existing
        ? await prisma.contact.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              email: row.email ?? null,
              tags: normalizeTags(row.tags),
              segment: row.segment ?? null,
              stage: row.stage ?? "NEW_LEAD",
              optedIn: keepUnsubscribed ? false : row.optedIn ?? true,
              metadata: row.metadata as Prisma.InputJsonValue | undefined
            }
          })
        : await prisma.contact.create({
            data: {
              companyId,
              name: row.name,
              phone: row.phone,
              email: row.email ?? undefined,
              tags: normalizeTags(row.tags),
              segment: row.segment ?? undefined,
              stage: row.stage ?? "NEW_LEAD",
              optedIn: row.optedIn ?? true,
              metadata: row.metadata as Prisma.InputJsonValue | undefined
            }
          });

      results.push(contact);
    }

    return ok({ imported: results.length, skipped, items: results });
  } catch (error) {
    return handleApiError(error);
  }
}

async function parseJsonRows(request: Request) {
  const payload = jsonImportSchema.parse(await request.json());
  return payload.rows;
}

async function parseFileRows(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new ApiError(400, "MISSING_FILE", "Upload a CSV or Excel file in the 'file' form field.");
  }

  const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<RawRow>(workbook.Sheets[firstSheet], { defval: "" });
}

function normalizeImportRow(row: RawRow) {
  const get = (...keys: string[]) => {
    const entry = Object.entries(row).find(([key]) =>
      keys.some((candidate) => key.toLowerCase().trim() === candidate.toLowerCase())
    );

    return entry?.[1];
  };

  return {
    name: String(get("name", "customer name", "full name") ?? "").trim(),
    phone: String(get("phone", "mobile", "whatsapp", "whatsapp number") ?? "").trim(),
    email: String(get("email", "email address") ?? "").trim() || undefined,
    tags: String(get("tags", "tag") ?? "").trim() || undefined,
    segment: String(get("segment", "audience") ?? "").trim() || undefined,
    stage: String(get("stage", "crm stage") ?? "NEW_LEAD").trim() || "NEW_LEAD",
    optedIn: String(get("optedIn", "opted in", "consent") ?? "true").toLowerCase() !== "false"
  };
}
