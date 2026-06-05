import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetaMediaInfo = {
  url?: string;
  mime_type?: string;
};

export async function GET(_request: Request, { params }: { params: { mediaId: string } }) {
  try {
    const { context } = await requirePermission("messages.viewLogs");
    const mediaId = decodeURIComponent(params.mediaId).trim();

    if (!mediaId) {
      throw new ApiError(400, "INVALID_MEDIA_ID", "Media ID is required.");
    }

    const log = await prisma.messageLog.findFirst({
      where: {
        companyId: context.company.id,
        channel: "WHATSAPP",
        direction: "INBOUND",
        mediaId
      },
      select: {
        id: true,
        mediaMimeType: true,
        mediaFilename: true
      }
    });

    if (!log) {
      throw new ApiError(404, "MEDIA_NOT_FOUND", "Media was not found for this workspace.");
    }

    if (!context.company.whatsappAccessToken) {
      throw new ApiError(400, "WHATSAPP_NOT_CONFIGURED", "WhatsApp Cloud API is required to load this media.");
    }

    const apiVersion = process.env.WHATSAPP_API_VERSION || "v20.0";
    const infoResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(mediaId)}`, {
      headers: {
        Authorization: `Bearer ${context.company.whatsappAccessToken}`
      }
    });

    if (!infoResponse.ok) {
      throw new ApiError(502, "MEDIA_PROVIDER_ERROR", "WhatsApp provider could not load this media.");
    }

    const mediaInfo = (await infoResponse.json().catch(() => ({}))) as MetaMediaInfo;
    if (!mediaInfo.url) {
      throw new ApiError(502, "MEDIA_PROVIDER_ERROR", "WhatsApp provider did not return a media URL.");
    }

    const mediaResponse = await fetch(mediaInfo.url, {
      headers: {
        Authorization: `Bearer ${context.company.whatsappAccessToken}`
      }
    });

    if (!mediaResponse.ok || !mediaResponse.body) {
      throw new ApiError(502, "MEDIA_PROVIDER_ERROR", "WhatsApp provider rejected the media download.");
    }

    const contentType = mediaInfo.mime_type || log.mediaMimeType || mediaResponse.headers.get("content-type") || "application/octet-stream";

    return new Response(mediaResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "Content-Disposition": contentDisposition(log.mediaFilename)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function contentDisposition(filename: string) {
  const safeName = filename.trim().replace(/[^\w.\- ]+/g, "");
  return safeName ? `inline; filename="${safeName}"` : "inline";
}
