import { z } from "zod";
import { ApiError, handleApiError, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { clearSelectedWorkspaceId, setSelectedWorkspaceId } from "@/lib/workspace-selection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const workspaceSelectSchema = z.object({
  companyId: z.string().trim().min(1, "Workspace is required.")
});

export async function POST(request: Request) {
  try {
    await requirePermission("settings.manage");
    const input = await parseJson(request, workspaceSelectSchema);
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
      select: {
        id: true,
        name: true,
        plan: true
      }
    });

    if (!company) {
      throw new ApiError(404, "WORKSPACE_NOT_FOUND", "Workspace was not found.");
    }

    setSelectedWorkspaceId(company.id);

    return ok({
      selectedWorkspace: company,
      warning: "Beta/admin-only workspace selection. Production switching must validate user membership."
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    await requirePermission("settings.manage");
    clearSelectedWorkspaceId();

    return ok({
      selectedWorkspace: null,
      defaultMode: true,
      warning: "Beta/admin-only workspace selection cleared."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
