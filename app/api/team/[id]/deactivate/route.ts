import { getCurrentAuthContext, assertRole } from "@/lib/auth";
import { ApiError, handleApiError, ok } from "@/lib/api";
import { recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { canChangeOwnerSafely, getTeamRoleLabel } from "@/lib/team-member-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getCurrentAuthContext();
    assertRole(context, ["OWNER", "ADMIN"]);

    const existing = await prisma.user.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Team member was not found.");
    }

    if (existing.id === context.user.id) {
      throw new ApiError(422, "CANNOT_DEACTIVATE_SELF", "You cannot deactivate your own active session user.");
    }

    const currentOwnersCount = await prisma.user.count({
      where: { companyId: context.company.id, role: "OWNER", isActive: true }
    });
    const ownerCheck = canChangeOwnerSafely({
      currentOwnersCount,
      currentRole: existing.role,
      nextRole: existing.role,
      nextStatus: "INACTIVE"
    });

    if (!ownerCheck.safe) {
      throw new ApiError(422, "LAST_OWNER_PROTECTED", ownerCheck.message);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await recordActivity({
      companyId: context.company.id,
      action: "TEAM_MEMBER_DEACTIVATED",
      entityType: "TEAM_MEMBER",
      entityId: user.id,
      entityLabel: safeActivityLabel(user.name, user.email),
      summary: "Deactivated team member workspace record.",
      metadataSummary: `Role: ${getTeamRoleLabel(user.role)}; Status: INACTIVE`
    });

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}
