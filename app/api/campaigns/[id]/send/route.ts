import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
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
}
