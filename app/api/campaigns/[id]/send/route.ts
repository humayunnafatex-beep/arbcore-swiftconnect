import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requirePermission("campaign.manage");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CAMPAIGN_SENDING_DISABLED",
          message: "Campaigns are drafts only in this phase. No bulk messages are sent."
        }
      },
      { status: 409 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
