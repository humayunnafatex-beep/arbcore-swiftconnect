import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getPlanLimits, normalizePlanName } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { sanitizeLogMetadata } from "@/lib/safe-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardWarning = {
  module: string;
  message: string;
};

const optionalMetricMessage = "Metrics are temporarily unavailable. Production migrations may be pending.";
const metricTimeoutMs = process.env.NODE_ENV === "development" ? 12000 : 15000;

export async function GET() {
  try {
    const requestStartedAt = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { context } = await requirePermission("dashboard.view");
    const authElapsedMs = Date.now() - requestStartedAt;
    if (authElapsedMs >= 2000) {
      console.warn("Dashboard auth context slow:", { elapsedMs: authElapsedMs });
    }
    const { company } = context;
    const companyId = company.id;
    const warnings: DashboardWarning[] = [];

    const loadChannels = () => safeMetricGroup("channels", warnings, async () => {
      const [connectedNumbers] = await Promise.all([
        prisma.whatsAppAccount.count({ where: { companyId, status: "CONNECTED" } })
      ]);

      return {
        connectedNumbers,
        whatsappConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
        messengerConfigured: Boolean(company.messengerPageAccessToken)
      };
    }, {
      connectedNumbers: 0,
      whatsappConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
      messengerConfigured: Boolean(company.messengerPageAccessToken)
    });

    const loadMessageHealth = () => safeMetricGroup("messageHealth", warnings, async () => {
      const [metrics] = await prisma.$queryRaw<Array<{
        messagesSentToday: number;
        totalMessages: number;
        failedMessages: number;
        sentMessages: number;
        receivedMessages: number;
        attemptedMessages: number;
        whatsappMessages: number;
        messengerMessages: number;
        inboundMessages: number;
        outboundMessages: number;
      }>>`
        SELECT
          COUNT(*) FILTER (WHERE "direction" = 'OUTBOUND' AND "createdAt" >= ${today}
            AND "status" IN ('SENT', 'DELIVERED', 'READ'))::int AS "messagesSentToday",
          COUNT(*)::int AS "totalMessages",
          COUNT(*) FILTER (WHERE "status" = 'FAILED')::int AS "failedMessages",
          COUNT(*) FILTER (WHERE "status" IN ('SENT', 'DELIVERED', 'READ'))::int AS "sentMessages",
          COUNT(*) FILTER (WHERE "status" = 'RECEIVED')::int AS "receivedMessages",
          COUNT(*) FILTER (WHERE "status" = 'QUEUED')::int AS "attemptedMessages",
          COUNT(*) FILTER (WHERE "channel" = 'WHATSAPP')::int AS "whatsappMessages",
          COUNT(*) FILTER (WHERE "channel" = 'MESSENGER')::int AS "messengerMessages",
          COUNT(*) FILTER (WHERE "direction" = 'INBOUND')::int AS "inboundMessages",
          COUNT(*) FILTER (WHERE "direction" = 'OUTBOUND')::int AS "outboundMessages"
        FROM "MessageLog"
        WHERE "companyId" = ${companyId}
      `;

      return metrics;
    }, {
      messagesSentToday: 0,
      totalMessages: 0,
      failedMessages: 0,
      sentMessages: 0,
      receivedMessages: 0,
      attemptedMessages: 0,
      whatsappMessages: 0,
      messengerMessages: 0,
      inboundMessages: 0,
      outboundMessages: 0
    });

    const loadInbox = () => safeMetricGroup("inbox", warnings, async () => {
      const now = new Date();
      const [metrics] = await prisma.$queryRaw<Array<{
        openConversations: number;
        pendingConversations: number;
        closedConversations: number;
        unassignedConversations: number;
        dueFollowUps: number;
        upcomingFollowUps: number;
        doneFollowUps: number;
        unreadConversations: number;
        starredConversations: number;
        highPriorityConversations: number;
        urgentConversations: number;
        paymentPendingConversations: number;
        hotLeadConversations: number;
      }>>`
        SELECT
          COUNT(*) FILTER (WHERE "status" = 'OPEN')::int AS "openConversations",
          COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS "pendingConversations",
          COUNT(*) FILTER (WHERE "status" = 'CLOSED')::int AS "closedConversations",
          COUNT(*) FILTER (WHERE "assignedToId" IS NULL)::int AS "unassignedConversations",
          COUNT(*) FILTER (WHERE "followUpAt" <= ${now} AND "followUpDone" = false)::int AS "dueFollowUps",
          COUNT(*) FILTER (WHERE "followUpAt" > ${now} AND "followUpDone" = false)::int AS "upcomingFollowUps",
          COUNT(*) FILTER (WHERE "followUpDone" = true)::int AS "doneFollowUps",
          COUNT(*) FILTER (WHERE "isRead" = false)::int AS "unreadConversations",
          COUNT(*) FILTER (WHERE "isStarred" = true)::int AS "starredConversations",
          COUNT(*) FILTER (WHERE "priority" = 'HIGH')::int AS "highPriorityConversations",
          COUNT(*) FILTER (WHERE "priority" = 'URGENT')::int AS "urgentConversations",
          COUNT(*) FILTER (WHERE "quickLabel" = 'PAYMENT_PENDING')::int AS "paymentPendingConversations",
          COUNT(*) FILTER (WHERE "quickLabel" = 'HOT_LEAD')::int AS "hotLeadConversations"
        FROM "ConversationState"
        WHERE "companyId" = ${companyId}
      `;

      return {
        ...metrics
      };
    }, {
      openConversations: 0,
      pendingConversations: 0,
      closedConversations: 0,
      unassignedConversations: 0,
      dueFollowUps: 0,
      upcomingFollowUps: 0,
      doneFollowUps: 0,
      unreadConversations: 0,
      starredConversations: 0,
      highPriorityConversations: 0,
      urgentConversations: 0,
      paymentPendingConversations: 0,
      hotLeadConversations: 0
    });

    const loadCampaigns = () => safeMetricGroup("campaigns", warnings, async () => {
      const [metrics] = await prisma.$queryRaw<Array<{
        activeCampaigns: number;
        draftCampaigns: number;
        readyCampaigns: number;
        campaignsWithAudienceCriteria: number;
        readyCampaignsWithAudience: number;
        totalCampaigns: number;
      }>>`
        SELECT
          COUNT(*) FILTER (WHERE "status" IN ('READY', 'PAUSED'))::int AS "activeCampaigns",
          COUNT(*) FILTER (WHERE "status" = 'DRAFT')::int AS "draftCampaigns",
          COUNT(*) FILTER (WHERE "status" = 'READY')::int AS "readyCampaigns",
          COUNT(*) FILTER (WHERE
            "audienceStatus" <> '' OR "audienceTags" <> '' OR "audienceSearch" <> '' OR
            "audienceChannel" <> '' OR "audienceLimit" IS NOT NULL
          )::int AS "campaignsWithAudienceCriteria",
          COUNT(*) FILTER (WHERE "status" = 'READY' AND (
            "audienceStatus" <> '' OR "audienceTags" <> '' OR "audienceSearch" <> '' OR
            "audienceChannel" <> '' OR "audienceLimit" IS NOT NULL
          ))::int AS "readyCampaignsWithAudience",
          COUNT(*)::int AS "totalCampaigns"
        FROM "Campaign"
        WHERE "companyId" = ${companyId}
      `;

      return metrics;
    }, {
      activeCampaigns: 0,
      draftCampaigns: 0,
      readyCampaigns: 0,
      campaignsWithAudienceCriteria: 0,
      readyCampaignsWithAudience: 0,
      totalCampaigns: 0
    });

    const loadContacts = () => safeMetricGroup("contacts", warnings, async () => {
      const [metrics] = await prisma.$queryRaw<Array<{
        contacts: number;
        activeContacts: number;
        newLeads: number;
        interestedLeads: number;
        orderedContacts: number;
        followUpContacts: number;
      }>>`
        SELECT
          COUNT(*)::int AS "contacts",
          COUNT(*) FILTER (WHERE "doNotContact" = false AND "optedIn" = true)::int AS "activeContacts",
          COUNT(*) FILTER (WHERE "stage" = 'NEW_LEAD')::int AS "newLeads",
          COUNT(*) FILTER (WHERE "stage" = 'INTERESTED')::int AS "interestedLeads",
          COUNT(*) FILTER (WHERE "stage" IN ('ORDERED', 'DELIVERED', 'WON'))::int AS "orderedContacts",
          COUNT(*) FILTER (WHERE "stage" = 'FOLLOW_UP')::int AS "followUpContacts"
        FROM "Contact"
        WHERE "companyId" = ${companyId}
      `;

      return {
        ...metrics,
        totalContacts: metrics.contacts,
        hotLeads: metrics.newLeads + metrics.interestedLeads + metrics.followUpContacts
      };
    }, {
      contacts: 0,
      totalContacts: 0,
      hotLeads: 0,
      activeContacts: 0,
      newLeads: 0,
      interestedLeads: 0,
      orderedContacts: 0,
      followUpContacts: 0
    });

    const loadAutoReply = () => safeMetricGroup("autoReplyAnalytics", warnings, async () => {
      const [activeAutoReplyRules, [eventMetrics]] = await Promise.all([
        prisma.autoReplyRule.count({ where: { companyId, isActive: true } }),
        prisma.$queryRaw<Array<{ attempted: number; sent: number; failed: number }>>`
          SELECT
            COUNT(*)::int AS "attempted",
            COUNT(*) FILTER (WHERE "status" = 'SENT')::int AS "sent",
            COUNT(*) FILTER (WHERE "status" = 'FAILED')::int AS "failed"
          FROM "AutoReplyEvent"
          WHERE "companyId" = ${companyId} AND "createdAt" >= ${thirtyDaysAgo}
        `
      ]);
      const autoReplyAttempted30d = eventMetrics.attempted;
      const autoReplySent30d = eventMetrics.sent;
      const autoReplyFailed30d = eventMetrics.failed;

      return {
        activeAutoReplyRules,
        autoReplyAttempted30d,
        autoReplySent30d,
        autoReplyFailed30d,
        autoReplySuccessRate30d: autoReplyAttempted30d ? Math.round((autoReplySent30d / autoReplyAttempted30d) * 100) : 0
      };
    }, {
      activeAutoReplyRules: 0,
      autoReplyAttempted30d: 0,
      autoReplySent30d: 0,
      autoReplyFailed30d: 0,
      autoReplySuccessRate30d: 0
    });

    const loadOrders = () => safeMetricGroup("orders", warnings, async () => {
      const now = new Date();
      const [metrics] = await prisma.$queryRaw<Array<{
        draftOrders: number; confirmedOrders: number; packedOrders: number; shippedOrders: number;
        deliveredOrders: number; cancelledOrders: number; dueOrderFollowUps: number;
        upcomingOrderFollowUps: number; doneOrderFollowUps: number; unpaidOrders: number;
        codOrders: number; totalOrderValue: number;
      }>>`
        SELECT
          COUNT(*) FILTER (WHERE "orderStatus" = 'DRAFT')::int AS "draftOrders",
          COUNT(*) FILTER (WHERE "orderStatus" = 'CONFIRMED')::int AS "confirmedOrders",
          COUNT(*) FILTER (WHERE "orderStatus" = 'PACKED')::int AS "packedOrders",
          COUNT(*) FILTER (WHERE "orderStatus" = 'SHIPPED')::int AS "shippedOrders",
          COUNT(*) FILTER (WHERE "orderStatus" = 'DELIVERED')::int AS "deliveredOrders",
          COUNT(*) FILTER (WHERE "orderStatus" = 'CANCELLED')::int AS "cancelledOrders",
          COUNT(*) FILTER (WHERE "followUpAt" <= ${now} AND "followUpDone" = false)::int AS "dueOrderFollowUps",
          COUNT(*) FILTER (WHERE "followUpAt" > ${now} AND "followUpDone" = false)::int AS "upcomingOrderFollowUps",
          COUNT(*) FILTER (WHERE "followUpDone" = true)::int AS "doneOrderFollowUps",
          COUNT(*) FILTER (WHERE "paymentStatus" = 'UNPAID')::int AS "unpaidOrders",
          COUNT(*) FILTER (WHERE "paymentStatus" = 'COD')::int AS "codOrders",
          COALESCE(SUM("totalAmount") FILTER (WHERE "orderStatus" IN ('CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED')), 0)::int AS "totalOrderValue"
        FROM "Order"
        WHERE "companyId" = ${companyId}
      `;

      return metrics;
    }, {
      draftOrders: 0,
      confirmedOrders: 0,
      packedOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      dueOrderFollowUps: 0,
      upcomingOrderFollowUps: 0,
      doneOrderFollowUps: 0,
      unpaidOrders: 0,
      codOrders: 0,
      totalOrderValue: 0
    });

    const loadProducts = () => safeMetricGroup("products", warnings, async () => {
      const [metrics] = await prisma.$queryRaw<Array<{
        activeProducts: number;
        draftProducts: number;
        archivedProducts: number;
        productsWithStockNote: number;
      }>>`
        SELECT
          COUNT(*) FILTER (WHERE "status" = 'ACTIVE')::int AS "activeProducts",
          COUNT(*) FILTER (WHERE "status" = 'DRAFT')::int AS "draftProducts",
          COUNT(*) FILTER (WHERE "status" = 'ARCHIVED')::int AS "archivedProducts",
          COUNT(*) FILTER (WHERE "stockNote" <> '')::int AS "productsWithStockNote"
        FROM "Product"
        WHERE "companyId" = ${companyId}
      `;

      return metrics;
    }, {
      activeProducts: 0,
      draftProducts: 0,
      archivedProducts: 0,
      productsWithStockNote: 0
    });

    const loadBilling = () => safeMetricGroup("billing", warnings, async () => {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const [subscription, [paymentMetrics], monthlyMessagesForPlan] = await Promise.all([
        prisma.subscription.findFirst({ where: { companyId }, orderBy: { createdAt: "desc" } }),
        prisma.$queryRaw<Array<{
          pendingPaymentCount: number;
          pendingPaymentAmount: number;
          lastPaymentDate: Date | null;
          lastPaymentAmount: number | null;
          currency: string | null;
        }>>`
          SELECT
            COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS "pendingPaymentCount",
            COALESCE(SUM("amount") FILTER (WHERE "status" = 'PENDING'), 0)::int AS "pendingPaymentAmount",
            (SELECT COALESCE(p."paidAt", p."createdAt") FROM "PaymentRecord" p
              WHERE p."companyId" = ${companyId} ORDER BY p."paidAt" DESC, p."createdAt" DESC LIMIT 1) AS "lastPaymentDate",
            (SELECT p."amount" FROM "PaymentRecord" p
              WHERE p."companyId" = ${companyId} ORDER BY p."paidAt" DESC, p."createdAt" DESC LIMIT 1) AS "lastPaymentAmount",
            (SELECT p."currency" FROM "PaymentRecord" p
              WHERE p."companyId" = ${companyId} ORDER BY p."paidAt" DESC, p."createdAt" DESC LIMIT 1) AS "currency"
          FROM "PaymentRecord"
          WHERE "companyId" = ${companyId}
        `,
        prisma.messageLog.count({
          where: { companyId, createdAt: { gte: monthStart } }
        })
      ]);
      const plan = normalizePlanName(subscription?.plan || company.plan);
      const limits = getPlanLimits(plan);
      const enabledChannelCount = [
        company.whatsappPhoneNumberId && company.whatsappAccessToken,
        company.messengerPageId && company.messengerPageAccessToken
      ].filter(Boolean).length;

      return {
        billing: {
          plan,
          status: subscription?.status || "ACTIVE",
          pendingPaymentCount: paymentMetrics.pendingPaymentCount,
          pendingPaymentAmount: paymentMetrics.pendingPaymentAmount,
          lastPaymentDate: paymentMetrics.lastPaymentDate?.toISOString() ?? null,
          lastPaymentAmount: paymentMetrics.lastPaymentAmount,
          currency: paymentMetrics.currency || "BDT",
          usage: {
            contacts: 0,
            contactsLimit: limits.contacts,
            monthlyMessages: monthlyMessagesForPlan,
            monthlyMessagesLimit: limits.monthlyMessages,
            enabledChannelCount
          }
        }
      };
    }, {
      billing: {
        plan: normalizePlanName(company.plan),
        status: "ACTIVE",
        pendingPaymentCount: 0,
        pendingPaymentAmount: 0,
        lastPaymentDate: null,
        lastPaymentAmount: null,
        currency: "BDT",
        usage: {
          contacts: 0,
          contactsLimit: getPlanLimits(normalizePlanName(company.plan)).contacts,
          monthlyMessages: 0,
          monthlyMessagesLimit: getPlanLimits(normalizePlanName(company.plan)).monthlyMessages,
          enabledChannelCount: 0
        }
      }
    });

    const loadWorkspace = () => safeMetricGroup("workspace", warnings, async () => {
      const [metrics] = await prisma.$queryRaw<Array<{ teamMembers: number; aiCreditsUsed: number }>>`
        SELECT
          (SELECT COUNT(*)::int FROM "User" WHERE "companyId" = ${companyId} AND "isActive" = true) AS "teamMembers",
          (SELECT COUNT(*)::int FROM "AiGeneration" WHERE "companyId" = ${companyId}) AS "aiCreditsUsed"
      `;

      return metrics;
    }, {
      teamMembers: 0,
      aiCreditsUsed: 0
    });

    const loadSavedReplies = () => safeMetricGroup("savedReplies", warnings, async () => {
      const activeSavedReplies = await prisma.savedReply.count({ where: { companyId, status: "ACTIVE" } });

      return { activeSavedReplies };
    }, {
      activeSavedReplies: 0
    });

    const loadActivity = () => safeMetricGroup("activity", warnings, async () => {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [metrics] = await prisma.$queryRaw<Array<{
        recentActivityCount24h: number;
        recentActivityCount7d: number;
      }>>`
        SELECT
          COUNT(*) FILTER (WHERE "createdAt" >= ${last24h})::int AS "recentActivityCount24h",
          COUNT(*) FILTER (WHERE "createdAt" >= ${last7d})::int AS "recentActivityCount7d"
        FROM "ActivityLog"
        WHERE "companyId" = ${companyId}
      `;

      return metrics;
    }, {
      recentActivityCount24h: 0,
      recentActivityCount7d: 0
    });

    const loadFollowUpQueue = () => safeMetricGroup("followUpQueue", warnings, async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const [metrics] = await prisma.$queryRaw<Array<{
        overdueFollowUps: number;
        todayFollowUps: number;
        totalUpcomingFollowUps: number;
      }>>`
        WITH follow_ups AS (
          SELECT "followUpAt" FROM "ConversationState"
          WHERE "companyId" = ${companyId} AND "followUpDone" = false
          UNION ALL
          SELECT "followUpAt" FROM "Order"
          WHERE "companyId" = ${companyId} AND "followUpDone" = false
        )
        SELECT
          COUNT(*) FILTER (WHERE "followUpAt" < ${todayStart})::int AS "overdueFollowUps",
          COUNT(*) FILTER (WHERE "followUpAt" >= ${todayStart} AND "followUpAt" < ${tomorrowStart})::int AS "todayFollowUps",
          COUNT(*) FILTER (WHERE "followUpAt" >= ${tomorrowStart})::int AS "totalUpcomingFollowUps"
        FROM follow_ups
      `;

      return metrics;
    }, {
      overdueFollowUps: 0,
      todayFollowUps: 0,
      totalUpcomingFollowUps: 0
    });

    // Keep database pressure bounded without adding four sequential network
    // round-trip waves between Vercel and Supabase.
    const [channels, messageHealth, inbox, campaigns, contacts, autoReply, products] = await Promise.all([
      loadChannels(),
      loadMessageHealth(),
      loadInbox(),
      loadCampaigns(),
      loadContacts(),
      loadAutoReply(),
      loadProducts()
    ]);
    const [orders, billing, workspace, savedReplies, activity, followUpQueue] = await Promise.all([
      loadOrders(),
      loadBilling(),
      loadWorkspace(),
      loadSavedReplies(),
      loadActivity(),
      loadFollowUpQueue()
    ]);
    const dashboardBilling = {
      ...billing.billing,
      usage: {
        ...billing.billing.usage,
        contacts: contacts.contacts
      }
    };

    const response = ok({
      ...channels,
      ...messageHealth,
      ...inbox,
      ...campaigns,
      ...contacts,
      ...autoReply,
      ...orders,
      ...products,
      ...workspace,
      ...savedReplies,
      ...activity,
      ...followUpQueue,
      billing: dashboardBilling,
      warnings,
      apiStatus: warnings.length ? "Degraded" : "Operational"
    });
    const totalElapsedMs = Date.now() - requestStartedAt;
    if (totalElapsedMs >= 5000) {
      console.warn("Dashboard statistics request slow:", { elapsedMs: totalElapsedMs });
    }
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

async function safeMetricGroup<T>(
  module: string,
  warnings: DashboardWarning[],
  load: () => Promise<T>,
  fallback: T
) {
  const startedAt = Date.now();
  try {
    const result = await withMetricTimeout(load(), module);
    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs >= 3000) {
      console.warn(`Dashboard ${module} metrics slow:`, { elapsedMs });
    }
    return result;
  } catch (error) {
    console.error(`Dashboard ${module} metrics failed:`, {
      elapsedMs: Date.now() - startedAt,
      timeout: isMetricTimeout(error),
      error: sanitizeLogMetadata(error)
    });
    warnings.push({
      module,
      message: optionalMetricMessage
    });
    return fallback;
  }
}

function withMetricTimeout<T>(promise: Promise<T>, module: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${module} metrics timed out`)), metricTimeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function isMetricTimeout(error: unknown) {
  return error instanceof Error && error.message.endsWith("metrics timed out");
}
