import { getCurrentAuthContext, assertRole } from "@/lib/auth";
import { ApiError, handleApiError, ok, parseJson } from "@/lib/api";
import { formatChangeSummary, recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { canChangeOwnerSafely, getTeamRoleLabel, normalizeTeamRole, normalizeTeamStatus } from "@/lib/team-member-input";
import { teamMemberUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return updateTeamMember(request, params.id);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updateTeamMember(request, params.id);
}

async function updateTeamMember(request: Request, id: string) {
  try {
    const context = await getCurrentAuthContext();
    assertRole(context, ["OWNER", "ADMIN"]);
    const input = await parseJson(request, teamMemberUpdateSchema);

    const existing = await prisma.user.findFirst({
      where: { id, companyId: context.company.id }
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Team member was not found.");
    }

    if (existing.id === context.user.id && input.isActive === false) {
      throw new ApiError(422, "CANNOT_DEACTIVATE_SELF", "You cannot deactivate your own active session user.");
    }

    const currentOwnersCount = await prisma.user.count({
      where: { companyId: context.company.id, role: "OWNER", isActive: true }
    });
    const nextRole = normalizeTeamRole(input.role ?? existing.role);
    const nextStatus = normalizeTeamStatus(input.isActive ?? existing.isActive);
    const ownerCheck = canChangeOwnerSafely({
      currentOwnersCount,
      currentRole: existing.role,
      nextRole,
      nextStatus
    });

    if (!ownerCheck.safe) {
      throw new ApiError(422, "LAST_OWNER_PROTECTED", ownerCheck.message);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        role: nextRole,
        isActive: nextStatus === "ACTIVE"
      },
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

    const action = getTeamMemberAction(existing, user);
    await recordActivity({
      companyId: context.company.id,
      action,
      entityType: "TEAM_MEMBER",
      entityId: user.id,
      entityLabel: safeActivityLabel(user.name, user.email),
      summary: formatChangeSummary(existing, user, ["name", "role", "isActive"]),
      metadataSummary: `Role: ${getTeamRoleLabel(user.role)}; Status: ${user.isActive ? "ACTIVE" : "INACTIVE"}`
    });

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
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

function getTeamMemberAction(
  before: { role: string; isActive: boolean },
  after: { role: string; isActive: boolean }
) {
  if (!before.isActive && after.isActive) return "TEAM_MEMBER_REACTIVATED";
  if (before.isActive && !after.isActive) return "TEAM_MEMBER_DEACTIVATED";
  if (before.role !== after.role) return "TEAM_MEMBER_ROLE_UPDATED";
  return "TEAM_MEMBER_UPDATED";
}
