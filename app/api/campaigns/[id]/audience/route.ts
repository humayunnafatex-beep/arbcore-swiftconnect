import { ContactStage, Prisma } from "@prisma/client";
import { ApiError, handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

const allowedStages = new Set<string>(["NEW_LEAD", "INTERESTED", "FOLLOW_UP", "WON", "LOST"]);
const allowedChannels = new Set(["", "WHATSAPP", "MESSENGER"]);

function textParam(searchParams: URLSearchParams, key: string, fallback: string) {
  const value = searchParams.get(key);
  return value === null ? fallback : value.trim();
}

function limitParam(searchParams: URLSearchParams, fallback: number | null) {
  const raw = searchParams.get("limit");
  const value = raw === null || raw.trim() === "" ? fallback : Number(raw);
  if (!value || Number.isNaN(value)) return null;
  return Math.min(Math.max(Math.floor(value), 1), 10000);
}

export async function GET(request: Request, { params }: Context) {
  try {
    const { searchParams } = new URL(request.url);
    const { context } = await requirePermission("campaign.view");
    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!campaign) {
      throw new ApiError(404, "CAMPAIGN_NOT_FOUND", "Campaign draft was not found.");
    }

    const audienceStatus = textParam(searchParams, "status", campaign.audienceStatus);
    const audienceTags = textParam(searchParams, "tags", campaign.audienceTags);
    const audienceSearch = textParam(searchParams, "search", campaign.audienceSearch);
    const audienceChannel = textParam(searchParams, "channel", campaign.audienceChannel);
    const audienceLimit = limitParam(searchParams, campaign.audienceLimit);
    const previewLimit = Math.min(audienceLimit ?? 50, 50);
    const tagTerms = audienceTags.split(",").map((tag) => tag.trim()).filter(Boolean);

    if (audienceStatus && !allowedStages.has(audienceStatus)) {
      throw new ApiError(422, "INVALID_AUDIENCE_STATUS", "Audience status is not valid.");
    }

    if (!allowedChannels.has(audienceChannel)) {
      throw new ApiError(422, "INVALID_AUDIENCE_CHANNEL", "Audience channel is not valid.");
    }

    const where = {
      companyId: context.company.id,
      optedIn: true,
      doNotContact: false,
      ...(audienceStatus ? { stage: audienceStatus as ContactStage } : {}),
      ...(audienceSearch
        ? {
            OR: [
              { name: { contains: audienceSearch } },
              { phone: { contains: audienceSearch } },
              { email: { contains: audienceSearch } },
              { tags: { contains: audienceSearch } },
              { segment: { contains: audienceSearch } }
            ]
          }
        : {}),
      ...(tagTerms.length ? { AND: tagTerms.map((tag) => ({ tags: { contains: tag } })) } : {})
    } satisfies Prisma.ContactWhereInput;

    const [estimatedCount, preview] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: previewLimit,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          stage: true,
          tags: true
        }
      })
    ]);

    const warning = audienceChannel === "MESSENGER"
      ? "Preview only. Contacts do not store Messenger PSID yet, so Messenger campaign delivery is not available."
      : "Preview only. No messages will be sent.";

    return ok({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        audienceStatus,
        audienceTags,
        audienceSearch,
        audienceChannel,
        audienceLimit
      },
      audience: {
        estimatedCount,
        preview: preview.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          status: contact.stage,
          tags: contact.tags
        })),
        previewLimit,
        warning
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
