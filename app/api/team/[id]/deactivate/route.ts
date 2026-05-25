import { getCurrentAuthContext, assertRole } from "@/lib/auth";
import { ApiError, handleApiError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

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
