import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getCompany() {
  return prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
  });
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const existingCompany = await getCompany();

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    const company = await prisma.company.update({
      where: { id: existingCompany.id },
      data: {
        name: body.businessName || existingCompany.name,
        plan: body.workspace || existingCompany.plan || "Enterprise Workspace",
        phone: body.phone || "",
        website: body.website || "",
        timezone: body.timezone || "Asia/Dhaka",
        language: body.language || "English",
        notificationFailed: Boolean(body.notifications?.failed),
        notificationHotLead: Boolean(body.notifications?.hotLead),
        notificationBilling: Boolean(body.notifications?.billing),
        notificationWeekly: Boolean(body.notifications?.weekly),
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