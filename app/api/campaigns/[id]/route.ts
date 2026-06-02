import { CampaignStatus, Prisma } from "@prisma/client";
import { ApiError, handleApiError, ok, parseDate, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { campaignUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("campaign.view");
    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!campaign) {
      throw new ApiError(404, "CAMPAIGN_NOT_FOUND", "Campaign draft was not found.");
    }

    return ok(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const input = await parseJson(request, campaignUpdateSchema);
    const { context } = await requirePermission("campaign.manage");
    const existing = await prisma.campaign.findFirst({
      where: { id: params.id, companyId: context.company.id },
      select: { id: true }
    });

    if (!existing) {
      throw new ApiError(404, "CAMPAIGN_NOT_FOUND", "Campaign draft was not found.");
    }

    const data: Prisma.CampaignUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.channel !== undefined ? { channel: input.channel } : {}),
      ...(input.status !== undefined ? { status: input.status as CampaignStatus } : {}),
      ...(input.audienceNote !== undefined ? { audienceNote: input.audienceNote ?? "" } : {}),
      ...(input.audienceStatus !== undefined ? { audienceStatus: input.audienceStatus ?? "" } : {}),
      ...(input.audienceTags !== undefined ? { audienceTags: input.audienceTags ?? "" } : {}),
      ...(input.audienceSearch !== undefined ? { audienceSearch: input.audienceSearch ?? "" } : {}),
      ...(input.audienceChannel !== undefined ? { audienceChannel: input.audienceChannel ?? "" } : {}),
      ...(input.audienceLimit !== undefined ? { audienceLimit: input.audienceLimit ?? null } : {}),
      ...(input.messageBody !== undefined ? { messageBody: input.messageBody } : {}),
      ...(input.templateName !== undefined ? { templateName: input.templateName ?? "" } : {}),
      ...(input.templateVariables !== undefined ? { templateVariables: input.templateVariables as Prisma.InputJsonValue } : {}),
      ...(input.targetSegment !== undefined ? { targetSegment: input.targetSegment ?? null } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: parseDate(input.scheduledAt) ?? null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? "" } : {})
    };

    const campaign = await prisma.campaign.update({
      where: { id: existing.id },
      data
    });

    return ok(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("campaign.manage");
    const existing = await prisma.campaign.findFirst({
      where: { id: params.id, companyId: context.company.id },
      select: { id: true }
    });

    if (!existing) {
      throw new ApiError(404, "CAMPAIGN_NOT_FOUND", "Campaign draft was not found.");
    }

    const campaign = await prisma.campaign.update({
      where: { id: existing.id },
      data: { status: "ARCHIVED" }
    });

    return ok({ campaign, archived: true });
  } catch (error) {
    return handleApiError(error);
  }
}
