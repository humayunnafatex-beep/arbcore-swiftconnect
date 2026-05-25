import { getCurrentAuthContext, assertRole } from "@/lib/auth";
import { ApiError, handleApiError, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { teamMemberUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getCurrentAuthContext();
    assertRole(context, ["OWNER", "ADMIN"]);
    const input = await parseJson(request, teamMemberUpdateSchema);

    const existing = await prisma.user.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Team member was not found.");
    }

    if (existing.id === context.user.id && input.isActive === false) {
      throw new ApiError(422, "CANNOT_DEACTIVATE_SELF", "You cannot deactivate your own active session user.");
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        role: input.role,
        isActive: input.isActive
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

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}
