import { NextRequest, NextResponse } from "next/server";
import { getCurrentCompany } from "@/lib/current-company";
import { prisma } from "@/lib/prisma";

async function getCompany() {
  return getCurrentCompany();
}

export async function GET() {
  try {
    const company = await getCompany();

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
      businessName: company.businessName || company.name,
      workspace: company.workspaceName || company.plan || "Enterprise Workspace",
        phone: company.phone || "",
        website: company.website || "",
        timezone: company.timezone || "Asia/Dhaka",
        language: company.language || "English",
        notifications: {
          failed: company.notificationFailed,
          hotLead: company.notificationHotLead,
          billing: company.notificationBilling,
          weekly: company.notificationWeekly,
        },
        whatsappPhoneNumberId: company.whatsappPhoneNumberId,
        whatsappAccessToken: "",
        whatsappAccessTokenSaved: Boolean(company.whatsappAccessToken),
        whatsappVerifyToken: company.whatsappVerifyToken,
        whatsappWebhookUrl: company.whatsappWebhookUrl,
      },
    });
  } catch (error) {
    console.error("Company settings GET error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load company settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const existingCompany = await getCompany();

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    const businessName = String(body.businessName ?? "").trim();
    const workspace = String(body.workspace ?? "").trim();
    const whatsappAccessToken = typeof body.whatsappAccessToken === "string" ? body.whatsappAccessToken.trim() : undefined;

    const company = await prisma.company.update({
      where: { id: existingCompany.id },
      data: {
        businessName: businessName || existingCompany.businessName || existingCompany.name,
        workspaceName: workspace || existingCompany.workspaceName || existingCompany.plan || "Enterprise Workspace",
        phone: String(body.phone ?? "").trim(),
        website: String(body.website ?? "").trim(),
        timezone: String(body.timezone ?? "Asia/Dhaka").trim() || "Asia/Dhaka",
        language: String(body.language ?? "English").trim() || "English",
        notificationFailed: Boolean(body.notifications?.failed),
        notificationHotLead: Boolean(body.notifications?.hotLead),
        notificationBilling: Boolean(body.notifications?.billing),
        notificationWeekly: Boolean(body.notifications?.weekly),
        whatsappPhoneNumberId: String(body.whatsappPhoneNumberId ?? "").trim(),
        ...(whatsappAccessToken ? { whatsappAccessToken } : {}),
        whatsappVerifyToken: String(body.whatsappVerifyToken ?? "").trim(),
        whatsappWebhookUrl: String(body.whatsappWebhookUrl ?? "").trim(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        businessName: company.name,
        workspace: company.plan || "Enterprise Workspace",
        phone: company.phone || "",
        website: company.website || "",
        timezone: company.timezone || "Asia/Dhaka",
        language: company.language || "English",
        notifications: {
          failed: company.notificationFailed,
          hotLead: company.notificationHotLead,
          billing: company.notificationBilling,
          weekly: company.notificationWeekly,
        },
        whatsappPhoneNumberId: company.whatsappPhoneNumberId,
        whatsappAccessToken: "",
        whatsappAccessTokenSaved: Boolean(company.whatsappAccessToken),
        whatsappVerifyToken: company.whatsappVerifyToken,
        whatsappWebhookUrl: company.whatsappWebhookUrl,
      },
    });
  } catch (error) {
    console.error("Company settings PUT error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to save company settings" },
      { status: 500 }
    );
  }
}
