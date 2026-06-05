"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Clock, CreditCard, FileText, Inbox, Link as LinkIcon, MessageCircle, MessageSquareText, Send, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { kpis } from "@/data/dashboard";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const iconMap = [Users, Send, MessageSquareText, Bot, Users];

const toneClasses = {
  whatsapp: "from-emerald-400 to-cyan-500",
  sky: "from-sky-400 to-royal",
  blue: "from-blue-400 to-electric",
  violet: "from-violet-500 to-royal"
};

type DashboardStatistics = {
  warnings?: Array<{
    module: string;
    message: string;
  }>;
  connectedNumbers: number;
  messagesSentToday: number;
  totalMessages: number;
  openConversations: number;
  pendingConversations: number;
  closedConversations: number;
  unassignedConversations: number;
  dueFollowUps: number;
  upcomingFollowUps: number;
  doneFollowUps: number;
  failedMessages: number;
  sentMessages: number;
  receivedMessages: number;
  attemptedMessages: number;
  whatsappMessages: number;
  messengerMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  activeCampaigns: number;
  draftCampaigns: number;
  readyCampaigns: number;
  campaignsWithAudienceCriteria: number;
  readyCampaignsWithAudience: number;
  totalCampaigns: number;
  contacts: number;
  totalContacts: number;
  hotLeads: number;
  activeContacts: number;
  newLeads: number;
  interestedLeads: number;
  orderedContacts: number;
  followUpContacts: number;
  activeAutoReplyRules: number;
  autoReplyAttempted30d: number;
  autoReplySent30d: number;
  autoReplyFailed30d: number;
  autoReplySuccessRate30d: number;
  draftOrders: number;
  confirmedOrders: number;
  packedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  dueOrderFollowUps: number;
  upcomingOrderFollowUps: number;
  doneOrderFollowUps: number;
  unpaidOrders: number;
  codOrders: number;
  totalOrderValue: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  productsWithStockNote: number;
  teamMembers: number;
  aiCreditsUsed: number;
  whatsappConfigured: boolean;
  messengerConfigured: boolean;
  billing: {
    plan: string;
    status: string;
    pendingPaymentCount: number;
    pendingPaymentAmount: number;
    lastPaymentDate: string | null;
    lastPaymentAmount: number | null;
    currency: string;
    usage: {
      contacts: number;
      contactsLimit: number | null;
      monthlyMessages: number;
      monthlyMessagesLimit: number | null;
      enabledChannelCount: number;
    };
  };
  apiStatus: string;
};

export function MetricGrid() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiRequest<DashboardStatistics>("/api/dashboard/statistics")
      .then((data) => {
        if (!active) return;
        setStats(data);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const liveKpis = useMemo(() => {
    if (!stats) return kpis;

    return [
      {
        ...kpis[0],
        label: "Contacts",
        value: stats.contacts.toLocaleString(),
        change: stats.connectedNumbers > 0 ? "Online" : "Offline",
        helper: `${stats.connectedNumbers} connected number(s) - API ${stats.apiStatus}`
      },
      {
        ...kpis[1],
        value: stats.messagesSentToday.toLocaleString(),
        helper: `${stats.totalMessages.toLocaleString()} total message log(s)`
      },
      {
        ...kpis[2],
        value: stats.openConversations.toLocaleString(),
        helper: "Live open inbox count"
      },
      {
        ...kpis[3],
        label: "Active Auto Replies",
        value: stats.activeAutoReplyRules.toLocaleString(),
        helper: `${stats.draftCampaigns.toLocaleString()} draft campaign(s)`
      },
      {
        ...kpis[0],
        label: "Team Members",
        value: stats.teamMembers.toLocaleString(),
        change: "Active",
        helper: "Active workspace users",
        tone: "whatsapp" as const
      }
    ];
  }, [stats]);

  return (
    <div>
      {error ? (
        <div className="mb-4 rounded-[18px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Dashboard API error: {error}
        </div>
      ) : null}
      {stats?.warnings?.length ? (
        <div className="mb-4 rounded-[18px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <p className="font-black">Some metrics are temporarily unavailable.</p>
          <p className="mt-1">Check production migrations. Dashboard remains available with safe fallback values.</p>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
      {liveKpis.map((item, index) => {
        const Icon = iconMap[index];
        const isOnline = item.change === "Online";
        return (
          <article
            key={item.label}
            className="flex min-h-[128px] items-center gap-5 rounded-[24px] border border-blue-100/80 bg-white/92 p-5 shadow-panel backdrop-blur"
          >
            <span
              className={cn(
                "grid h-16 w-16 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br text-white shadow-glow",
                toneClasses[item.tone]
              )}
            >
              <Icon className="h-8 w-8" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink">{item.label}</span>
              <span className="mt-2 flex flex-wrap items-center gap-3">
                <span className={cn("text-3xl font-black text-ink", loading && "h-9 w-24 animate-pulse rounded-lg bg-blue-100 text-transparent")}>
                  {loading ? "..." : item.value}
                </span>
                <span
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-bold",
                    isOnline ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-royal"
                  )}
                >
                  {isOnline ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  {item.change}
                </span>
              </span>
              <span className="mt-1 block truncate text-xs font-medium text-slate-500">{item.helper}</span>
            </span>
          </article>
        );
      })}
      </div>
      <DashboardSections stats={stats} loading={loading} />
    </div>
  );
}

function DashboardSections({ stats, loading }: { stats: DashboardStatistics | null; loading: boolean }) {
  const empty = {
    openConversations: 0,
    pendingConversations: 0,
    closedConversations: 0,
    unassignedConversations: 0,
    dueFollowUps: 0,
    upcomingFollowUps: 0,
    doneFollowUps: 0,
    failedMessages: 0,
    sentMessages: 0,
    receivedMessages: 0,
    attemptedMessages: 0,
    whatsappMessages: 0,
    messengerMessages: 0,
    inboundMessages: 0,
    outboundMessages: 0,
    draftCampaigns: 0,
    readyCampaigns: 0,
    campaignsWithAudienceCriteria: 0,
    readyCampaignsWithAudience: 0,
    totalCampaigns: 0,
    newLeads: 0,
    interestedLeads: 0,
    orderedContacts: 0,
    followUpContacts: 0,
    autoReplyAttempted30d: 0,
    autoReplySent30d: 0,
    autoReplyFailed30d: 0,
    autoReplySuccessRate30d: 0,
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
    totalOrderValue: 0,
    activeProducts: 0,
    draftProducts: 0,
    archivedProducts: 0,
    productsWithStockNote: 0,
    whatsappConfigured: false,
    messengerConfigured: false,
    billing: {
      plan: "ENTERPRISE_BETA",
      status: "ACTIVE",
      pendingPaymentCount: 0,
      pendingPaymentAmount: 0,
      lastPaymentDate: null,
      lastPaymentAmount: null,
      currency: "BDT",
      usage: {
        contacts: 0,
        contactsLimit: 1000,
        monthlyMessages: 0,
        monthlyMessagesLimit: 5000,
        enabledChannelCount: 0
      }
    }
  };
  const data = stats ?? empty;

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-2">
      <MetricSection
        title="Support Inbox Overview"
        helper={data.openConversations ? "Open conversations need attention." : "No conversations yet."}
        items={[
          { label: "Open", value: data.openConversations, href: "/inbox?status=OPEN", icon: Inbox, tone: "green" },
          { label: "Pending", value: data.pendingConversations, href: "/inbox?status=PENDING", icon: Clock, tone: "blue" },
          { label: "Closed", value: data.closedConversations, href: "/inbox?status=CLOSED", icon: CheckCircle2, tone: "gray" },
          { label: "Unassigned", value: data.unassignedConversations, href: "/inbox?assignedTo=UNASSIGNED", icon: Users, tone: "purple" }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Follow-up Overview"
        helper={data.dueFollowUps ? "Due follow-ups should be handled from Inbox." : "No follow-ups due."}
        items={[
          { label: "Due", value: data.dueFollowUps, href: "/inbox?followUp=DUE", icon: AlertTriangle, tone: "red" },
          { label: "Upcoming", value: data.upcomingFollowUps, href: "/inbox?followUp=UPCOMING", icon: Clock, tone: "blue" },
          { label: "Done", value: data.doneFollowUps, href: "/inbox?followUp=DONE", icon: CheckCircle2, tone: "green" }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Message Health"
        helper={data.failedMessages ? "Review failed messages from Message Logs." : "No failed messages."}
        items={[
          { label: "Sent", value: data.sentMessages, href: "/message-logs?status=SENT", icon: Send, tone: "green" },
          { label: "Received", value: data.receivedMessages, href: "/message-logs?status=RECEIVED", icon: MessageSquareText, tone: "blue" },
          { label: "Failed", value: data.failedMessages, href: "/message-logs?status=FAILED", icon: AlertTriangle, tone: "red" },
          { label: "Attempted", value: data.attemptedMessages, href: "/message-logs?status=ATTEMPTED", icon: Clock, tone: "gray" }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Channel Activity"
        helper="Use Channel Center for setup status and diagnostics."
        items={[
          { label: "WhatsApp", value: data.whatsappMessages, href: "/message-logs?channel=WHATSAPP", icon: MessageCircle, tone: data.whatsappConfigured ? "green" : "gray", badge: data.whatsappConfigured ? "Configured" : "Not configured" },
          { label: "Messenger", value: data.messengerMessages, href: "/message-logs?channel=MESSENGER", icon: MessageCircle, tone: data.messengerConfigured ? "green" : "gray", badge: data.messengerConfigured ? "Configured" : "Not configured" },
          { label: "Inbound", value: data.inboundMessages, href: "/message-logs?direction=INBOUND", icon: Inbox, tone: "blue" },
          { label: "Outbound", value: data.outboundMessages, href: "/message-logs?direction=OUTBOUND", icon: Send, tone: "purple" },
          { label: "Channel Center", value: data.whatsappConfigured || data.messengerConfigured ? 1 : 0, href: "/channels", icon: LinkIcon, tone: "blue", displayValue: "Open" }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Order Operations"
        helper={data.dueOrderFollowUps ? "Due order follow-ups need attention." : data.unpaidOrders ? "Unpaid orders need payment follow-up." : "No order follow-up alerts."}
        items={[
          { label: "Draft", value: data.draftOrders, href: "/orders?status=DRAFT", icon: ShoppingBag, tone: "gray" },
          { label: "Confirmed", value: data.confirmedOrders, href: "/orders?status=CONFIRMED", icon: CheckCircle2, tone: "green" },
          { label: "Packed", value: data.packedOrders, href: "/orders?status=PACKED", icon: ShoppingBag, tone: "purple" },
          { label: "Shipped", value: data.shippedOrders, href: "/orders?status=SHIPPED", icon: Send, tone: "blue" },
          { label: "Delivered", value: data.deliveredOrders, href: "/orders?status=DELIVERED", icon: CheckCircle2, tone: "green" },
          { label: "Due follow-ups", value: data.dueOrderFollowUps, href: "/orders?followUp=DUE", icon: AlertTriangle, tone: data.dueOrderFollowUps ? "red" : "gray" },
          { label: "Upcoming", value: data.upcomingOrderFollowUps, href: "/orders?followUp=UPCOMING", icon: Clock, tone: "blue" },
          { label: "Unpaid", value: data.unpaidOrders, href: "/orders?paymentStatus=UNPAID", icon: CreditCard, tone: data.unpaidOrders ? "red" : "gray" },
          { label: "COD", value: data.codOrders, href: "/orders?paymentStatus=COD", icon: CreditCard, tone: "purple" },
          { label: "Value", value: data.totalOrderValue, href: "/orders", icon: CreditCard, tone: "blue", displayValue: `BDT ${data.totalOrderValue.toLocaleString()}` }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Lead Status Snapshot"
        helper={data.followUpContacts ? "Follow-up contacts need sales attention." : "No follow-up contacts waiting."}
        items={[
          { label: "New", value: data.newLeads, href: "/contacts?status=NEW_LEAD", icon: Users, tone: "blue" },
          { label: "Interested", value: data.interestedLeads, href: "/contacts?status=INTERESTED", icon: TrendingUp, tone: "green" },
          { label: "Ordered", value: data.orderedContacts, href: "/contacts?status=ORDERED", icon: CheckCircle2, tone: "purple" },
          { label: "Follow-up", value: data.followUpContacts, href: "/contacts?status=FOLLOW_UP", icon: Clock, tone: "red" }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Product Catalog"
        helper={data.activeProducts ? "Active products can speed up Inbox order entry." : "No active products yet."}
        items={[
          { label: "Active", value: data.activeProducts, href: "/products?status=ACTIVE", icon: ShoppingBag, tone: "green" },
          { label: "Draft", value: data.draftProducts, href: "/products?status=DRAFT", icon: FileText, tone: "blue" },
          { label: "Archived", value: data.archivedProducts, href: "/products?status=ARCHIVED", icon: AlertTriangle, tone: "gray" },
          { label: "Stock notes", value: data.productsWithStockNote, href: "/products", icon: Clock, tone: "purple" }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Auto Reply Performance"
        helper={data.autoReplyFailed30d ? "Failed auto replies should be reviewed from Auto Reply Analytics and Message Logs." : "Auto reply failures are clear."}
        items={[
          { label: "Attempted 30d", value: data.autoReplyAttempted30d, href: "/auto-reply", icon: Bot, tone: "blue" },
          { label: "Sent 30d", value: data.autoReplySent30d, href: "/auto-reply", icon: CheckCircle2, tone: "green" },
          { label: "Failed 30d", value: data.autoReplyFailed30d, href: "/auto-reply", icon: AlertTriangle, tone: data.autoReplyFailed30d ? "red" : "gray" },
          { label: "Success rate", value: data.autoReplySuccessRate30d, href: "/auto-reply", icon: TrendingUp, tone: "purple", displayValue: `${data.autoReplySuccessRate30d}%` }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Billing Overview"
        helper={data.billing.pendingPaymentCount ? "Pending payments need manual review." : "No pending payments."}
        items={[
          { label: "Current plan", value: 1, href: "/billing", icon: CreditCard, tone: "blue", displayValue: data.billing.plan.replace(/_/g, " ") },
          { label: "Subscription", value: 1, href: "/billing", icon: CheckCircle2, tone: data.billing.status === "PAST_DUE" ? "red" : "green", displayValue: data.billing.status },
          { label: "Pending payments", value: data.billing.pendingPaymentCount, href: "/billing", icon: AlertTriangle, tone: data.billing.pendingPaymentCount ? "red" : "gray", badge: `${data.billing.currency} ${data.billing.pendingPaymentAmount.toLocaleString()}` },
          { label: "Last payment", value: data.billing.lastPaymentAmount ?? 0, href: "/billing", icon: CreditCard, tone: "purple", displayValue: data.billing.lastPaymentDate ? new Date(data.billing.lastPaymentDate).toLocaleDateString("en") : "-" }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Campaign Drafts"
        helper="Campaigns are planning drafts only. No bulk sending is active."
        items={[
          { label: "Drafts", value: data.draftCampaigns, href: "/campaigns?status=DRAFT", icon: FileText, tone: "blue" },
          { label: "Ready", value: data.readyCampaigns, href: "/campaigns?status=READY", icon: CheckCircle2, tone: "green" },
          { label: "With audience", value: data.campaignsWithAudienceCriteria, href: "/campaigns", icon: Users, tone: "purple" },
          { label: "Ready + audience", value: data.readyCampaignsWithAudience, href: "/campaigns?status=READY", icon: CreditCard, tone: "green" },
          { label: "Open Campaigns", value: 1, href: "/campaigns", icon: LinkIcon, tone: "blue", displayValue: "Open" }
        ]}
        loading={loading}
      />
      <MetricSection
        title="Plan Usage Snapshot"
        helper="Report-only usage. No beta features are blocked by plan limits yet."
        items={[
          { label: "Contacts", value: data.billing.usage.contacts, href: "/billing", icon: Users, tone: "blue", badge: `Limit ${formatLimit(data.billing.usage.contactsLimit)}` },
          { label: "Monthly messages", value: data.billing.usage.monthlyMessages, href: "/billing", icon: MessageSquareText, tone: "purple", badge: `Limit ${formatLimit(data.billing.usage.monthlyMessagesLimit)}` },
          { label: "Channels", value: data.billing.usage.enabledChannelCount, href: "/billing", icon: LinkIcon, tone: "green", displayValue: `${data.billing.usage.enabledChannelCount}` },
          { label: "Usage details", value: 1, href: "/billing", icon: CreditCard, tone: "blue", displayValue: "Open" }
        ]}
        loading={loading}
      />
    </div>
  );
}

function formatLimit(limit: number | null) {
  return limit === null ? "Custom" : limit.toLocaleString();
}

function MetricSection({
  title,
  helper,
  items,
  loading
}: {
  title: string;
  helper: string;
  items: Array<{
    label: string;
    value: number;
    href: string;
    icon: typeof Inbox;
    tone: "blue" | "green" | "gray" | "purple" | "red";
    badge?: string;
    displayValue?: string;
  }>;
  loading: boolean;
}) {
  return (
    <section className="rounded-[24px] border border-blue-100/80 bg-white/92 p-5 shadow-panel backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-ink">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.href} className="group rounded-[18px] border border-blue-100 bg-blue-50/55 p-4 transition hover:border-royal hover:bg-white">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("grid h-11 w-11 place-items-center rounded-[14px]", toneClass(item.tone))}>
                  <Icon className="h-5 w-5" />
                </span>
                {item.badge ? <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-blue-100">{item.badge}</span> : null}
              </div>
              <p className="mt-3 text-xs font-black uppercase text-slate-500">{item.label}</p>
              <p className={cn("mt-1 text-2xl font-black text-ink", loading && "h-8 w-16 animate-pulse rounded-lg bg-blue-100 text-transparent")}>
                {loading ? "..." : item.displayValue ?? item.value.toLocaleString()}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function toneClass(tone: "blue" | "green" | "gray" | "purple" | "red") {
  return cn(
    tone === "blue" && "bg-blue-100 text-royal",
    tone === "green" && "bg-emerald-100 text-emerald-700",
    tone === "gray" && "bg-slate-100 text-slate-600",
    tone === "purple" && "bg-violet-100 text-violet-700",
    tone === "red" && "bg-rose-100 text-rose-700"
  );
}
