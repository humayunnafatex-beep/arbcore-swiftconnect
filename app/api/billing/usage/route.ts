import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getPlanLimits, normalizePlanName } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function GET() {
  try {
    const { context } = await requirePermission("license.view");
    const { company } = context;
    const subscription = await prisma.subscription.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      select: { plan: true }
    });
    const plan = normalizePlanName(subscription?.plan || company.plan);
    const limits = getPlanLimits(plan);

    const [contacts, teamMembers, autoReplyRules, monthlyMessages, inboxConversations] = await Promise.all([
      prisma.contact.count({ where: { companyId: company.id } }),
      prisma.user.count({ where: { companyId: company.id, isActive: true } }),
      prisma.autoReplyRule.count({ where: { companyId: company.id } }),
      prisma.messageLog.count({ where: { companyId: company.id, createdAt: { gte: monthStart() } } }),
      prisma.conversationState.count({ where: { companyId: company.id } })
    ]);

    const enabledChannels = [
      company.whatsappPhoneNumberId && company.whatsappAccessToken ? "WHATSAPP" : null,
      company.messengerPageId && company.messengerPageAccessToken ? "MESSENGER" : null
    ].filter(Boolean) as Array<"WHATSAPP" | "MESSENGER">;

    return ok({
      plan,
      limits,
      usage: {
        contacts,
        teamMembers,
        autoReplyRules,
        monthlyMessages,
        inboxConversations,
        enabledChannels
      },
      reportOnly: true,
      notes: "Plan limits are not enforced in Enterprise Beta."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
