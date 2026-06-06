import { z } from "zod";
import { handleApiError, ok, parseJson } from "@/lib/api";
import { formatChangeSummary, recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, "Display name is required.").max(120)
});

export async function GET() {
  try {
    const { user, company } = await getCurrentAuthContext();

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      company: {
        id: company.id,
        name: company.name,
        plan: company.plan
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, company } = await getCurrentAuthContext();
    const input = await parseJson(request, profileUpdateSchema);

    const existing = await prisma.user.findFirst({
      where: { id: user.id, companyId: company.id }
    });

    if (!existing) {
      return ok({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        company: {
          id: company.id,
          name: company.name,
          plan: company.plan
        }
      });
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { name: input.name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    await recordActivity({
      companyId: company.id,
      action: "PROFILE_DISPLAY_NAME_UPDATED",
      entityType: "TEAM_MEMBER",
      entityId: updated.id,
      entityLabel: safeActivityLabel(updated.name, updated.email),
      summary: formatChangeSummary(existing, updated, ["name"]),
      metadataSummary: `Role: ${updated.role}; Status: ${updated.isActive ? "ACTIVE" : "INACTIVE"}`
    });

    return ok({
      ...updated,
      company: {
        id: company.id,
        name: company.name,
        plan: company.plan
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
