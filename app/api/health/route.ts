import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  let database: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  const appStatus = database === "ok" ? "ok" : "degraded";

  return NextResponse.json({
    success: true,
    data: {
      app: {
        name: "ARBCore SwiftConnect",
        status: appStatus
      },
      database: {
        status: database
      },
      environment: {
        mode: process.env.NODE_ENV ?? "development"
      },
      ai: {
        configured: Boolean(process.env.OPENAI_API_KEY)
      },
      whatsapp: {
        configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
      },
      timestamp
    }
  }, { status: appStatus === "ok" ? 200 : 503 });
}
