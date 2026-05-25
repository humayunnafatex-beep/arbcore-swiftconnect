import { getCurrentAuthContext, assertRole } from "@/lib/auth";
import { created, handleApiError, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { teamMemberCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
    const context = await getCurrentAuthContext();
    assertRole(context, ["OWNER", "ADMIN"]);
    const input = await parseJson(request, teamMemberCreateSchema);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
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

    return created(user);
  } catch (error) {
    return handleApiError(error);
  }
}
