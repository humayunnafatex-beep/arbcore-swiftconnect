import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { getSelectedWorkspaceId } from "@/lib/workspace-selection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("settings.manage");
    const selectedWorkspaceId = getSelectedWorkspaceId();
    const selectedWorkspace = selectedWorkspaceId
      ? await prisma.company.findUnique({
          where: { id: selectedWorkspaceId },
          select: {
            id: true,
            name: true,
            plan: true
          }
        })
      : null;

    return ok({
      selectedWorkspace,
      defaultMode: !selectedWorkspace,
      warning: "Beta/admin-only workspace selection."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
