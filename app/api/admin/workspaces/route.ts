import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError, created, handleApiError, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const workspaceCreateSchema = z.object({
  name: z.string().trim().min(2, "Company name is required.").max(120),
  slug: z.string().trim().max(80).optional().default(""),
  plan: z.string().trim().max(80).optional().default("ENTERPRISE_BETA"),
  ownerName: z.string().trim().max(120).optional().default(""),
  ownerEmail: z.string().trim().email("Owner email must be valid.").optional().or(z.literal(""))
});

export async function GET() {
  try {
    await requirePermission("settings.manage");

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        whatsappPhoneNumberId: true,
        messengerPageId: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            contacts: true,
            messageLogs: true
          }
        }
      }
    });

    return ok({
      items: companies.map((company) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        plan: company.plan,
        createdAt: company.createdAt,
        whatsappPhoneNumberIdPresent: Boolean(company.whatsappPhoneNumberId),
        messengerPageIdPresent: Boolean(company.messengerPageId),
        userCount: company._count.users,
        contactCount: company._count.contacts,
        messageCount: company._count.messageLogs
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission("settings.manage");
    const input = await parseJson(request, workspaceCreateSchema);
    const name = input.name.trim();
    const ownerEmail = (input.ownerEmail || "").trim().toLowerCase();
    const slug = await uniqueSlug(input.slug || name);

    const workspace = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name,
          slug,
          plan: input.plan.trim() || "ENTERPRISE_BETA",
          businessName: name,
          workspaceName: `${name} Workspace`
        },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          createdAt: true
        }
      });

      let owner: { id: string; name: string; email: string; role: string } | null = null;

      if (ownerEmail) {
        const existingUser = await tx.user.findUnique({
          where: { email: ownerEmail },
          select: { id: true }
        });

        if (existingUser) {
          throw new ApiError(409, "DUPLICATE_OWNER_EMAIL", "A user with this owner email already exists.");
        }

        owner = await tx.user.create({
          data: {
            name: input.ownerName.trim() || name,
            email: ownerEmail,
            role: "OWNER",
            isActive: true,
            companyId: company.id
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });
      }

      return { company, owner };
    });

    return created({
      workspace: {
        ...workspace.company,
        userCount: workspace.owner ? 1 : 0,
        contactCount: 0,
        messageCount: 0
      },
      owner: workspace.owner,
      note: "Workspace created. Channel credentials must be configured separately in Settings after auth/workspace mapping is verified."
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return handleApiError(new ApiError(409, "DUPLICATE_WORKSPACE", "A workspace with this slug or owner email already exists."));
    }

    return handleApiError(error);
  }
}

async function uniqueSlug(value: string) {
  const base = slugify(value) || "client-workspace";
  let candidate = base;
  let suffix = 2;

  while (await prisma.company.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
