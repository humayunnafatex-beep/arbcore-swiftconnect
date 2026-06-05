import { ApiError, handleApiError, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { formatChangeSummary, recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { autoReplyRuleUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("autoReply.view");
    const { company } = context;
    const rule = await prisma.autoReplyRule.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!rule) {
      throw new ApiError(404, "AUTO_REPLY_RULE_NOT_FOUND", "Auto reply rule was not found.");
    }

    return ok(rule);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const input = await parseJson(request, autoReplyRuleUpdateSchema);
    const { context } = await requirePermission("autoReply.manage");
    const { company } = context;
    const existing = await prisma.autoReplyRule.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!existing) {
      throw new ApiError(404, "AUTO_REPLY_RULE_NOT_FOUND", "Auto reply rule was not found.");
    }

    const rule = await prisma.autoReplyRule.update({
      where: { id: params.id },
      data: {
        ...("keyword" in input ? { keyword: input.keyword?.trim() } : {}),
        ...("response" in input ? { response: input.response?.trim() } : {}),
        ...("priority" in input ? { priority: input.priority } : {}),
        ...("isActive" in input ? { isActive: input.isActive } : {}),
        ...("matchMode" in input ? { matchMode: input.matchMode } : {})
      }
    });

    await recordActivity({
      companyId: company.id,
      action: "AUTO_REPLY_RULE_UPDATED",
      entityType: "AUTO_REPLY_RULE",
      entityId: rule.id,
      entityLabel: safeActivityLabel(rule.keyword, rule.matchMode),
      summary: formatChangeSummary(existing, rule, ["keyword", "priority", "isActive", "matchMode"]),
      metadataSummary: `Active: ${rule.isActive ? "yes" : "no"}; Priority: ${rule.priority}`
    });

    return ok(rule);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("autoReply.manage");
    const { company } = context;
    const existing = await prisma.autoReplyRule.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!existing) {
      throw new ApiError(404, "AUTO_REPLY_RULE_NOT_FOUND", "Auto reply rule was not found.");
    }

    await prisma.autoReplyRule.delete({ where: { id: params.id } });

    await recordActivity({
      companyId: company.id,
      action: "AUTO_REPLY_RULE_DELETED",
      entityType: "AUTO_REPLY_RULE",
      entityId: params.id,
      entityLabel: safeActivityLabel(existing.keyword, existing.matchMode),
      summary: "Deleted auto reply rule."
    });

    return ok({ id: params.id, deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
