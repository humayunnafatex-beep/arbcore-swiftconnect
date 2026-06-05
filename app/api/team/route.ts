import { getCurrentAuthContext, assertRole } from "@/lib/auth";
import { created, handleApiError, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTeamRoleLabel } from "@/lib/team-member-input";
import { teamMemberCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("team.view");
    const context = await getCurrentAuthContext();
    assertRole(context, ["OWNER", "ADMIN"]);

    const users = await prisma.user.findMany({
      where: { companyId: context.company.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
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

    return ok({ items: users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission("team.manage");
    const context = await getCurrentAuthContext();
    assertRole(context, ["OWNER", "ADMIN"]);
    const input = await parseJson(request, teamMemberCreateSchema);
    const email = input.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_TEAM_MEMBER",
            message: "A team member with this email already exists."
          }
        },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        role: input.role,
        isActive: true,
        companyId: context.company.id
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

    await recordActivity({
      companyId: context.company.id,
      action: "TEAM_MEMBER_CREATED",
      entityType: "TEAM_MEMBER",
      entityId: user.id,
      entityLabel: safeActivityLabel(user.name, user.email),
      summary: "Created team member workspace record.",
      metadataSummary: `Role: ${getTeamRoleLabel(user.role)}; Status: ACTIVE`
    });

    return created(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_TEAM_MEMBER",
            message: "A team member with this email already exists."
          }
        },
        { status: 409 }
      );
    }

    return handleApiError(error);
  }
}
