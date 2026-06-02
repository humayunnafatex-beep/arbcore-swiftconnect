"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "./app-shell";
import { DataState, formatDate, useApiData } from "./saas-page-utils";

type AnalyticsSummary = {
  totals: {
    messagesTotal: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    replies: number;
    campaigns: number;
    contacts: number;
    wonDeals: number;
    aiGenerations: number;
  };
  rates: {
    deliveryRate: number;
    readRate: number;
    responseRate: number;
    failureRate: number;
  };
  generatedAt: string;
};

export function AnalyticsModulePage() {
  const analytics = useApiData<AnalyticsSummary>("/api/analytics/summary");
  const totals = analytics.data?.totals;
  const rates = analytics.data?.rates;
  const conversionRate = totals?.contacts ? Math.round((totals.wonDeals / totals.contacts) * 1000) / 10 : 0;

  const messagesOverTime = [
    { day: "Mon", sent: 820, delivered: 780, read: 420 },
    { day: "Tue", sent: 960, delivered: 910, read: 510 },
    { day: "Wed", sent: 1120, delivered: 1070, read: 660 },
    { day: "Thu", sent: 1380, delivered: 1310, read: 780 },
    { day: "Fri", sent: 1190, delivered: 1135, read: 690 },
    { day: "Sat", sent: 740, delivered: 700, read: 390 },
    { day: "Sun", sent: 650, delivered: 610, read: 340 }
  ];
  const campaignPerformance = [
    { name: "Promo", delivered: 94, replies: 31 },
    { name: "Catalog", delivered: 91, replies: 24 },
    { name: "Follow-up", delivered: 88, replies: 19 },
    { name: "Winback", delivered: 83, replies: 14 }
  ];
  const replyTrend = [
    { week: "W1", rate: 13 },
    { week: "W2", rate: 16 },
    { week: "W3", rate: 18 },
    { week: "W4", rate: rates?.responseRate ?? 19 }
  ];
  const funnel = [
    { name: "Contacts", value: totals?.contacts ?? 1200, fill: "#2563eb" },
    { name: "Replies", value: totals?.replies ?? 420, fill: "#0ea5e9" },
    { name: "Won", value: totals?.wonDeals ?? 96, fill: "#10b981" }
  ];
  const topRows = [
    ["Promo - Special Offer", "VIP Buyers", "Draft", "Needs approved template review", "Phase 1"],
    ["Catalog Follow-up", "Interested", "Ready", "Audience note prepared", "Phase 1"],
    ["Payment Reminder", "Pending Orders", "Paused", "Policy wording review", "Phase 1"],
    ["Winback Offer", "Inactive 60d", "Draft", "No bulk sending active", "Phase 1"]
  ];

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
            <BarChart3 className="h-8 w-8" />
          </span>
          <div>
            <p className="text-xs font-black uppercase text-royal">Performance Analytics</p>
            <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Analytics Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Track messaging, campaign, reply, and CRM conversion performance for the current workspace.</p>
          </div>
        </div>
      </section>

      <DataState loading={analytics.loading} error={analytics.error} empty={!analytics.data} emptyText="No analytics data available yet.">
        <section className="grid gap-4 md:grid-cols-3 2xl:grid-cols-6">
          <Kpi label="Total Messages" value={(totals?.messagesTotal ?? 0).toLocaleString()} helper={`Updated ${formatDate(analytics.data?.generatedAt)}`} />
          <Kpi label="Delivered" value={(totals?.delivered ?? 0).toLocaleString()} helper={`${rates?.deliveryRate ?? 0}% delivery`} />
          <Kpi label="Read" value={(totals?.read ?? 0).toLocaleString()} helper={`${rates?.readRate ?? 0}% read rate`} />
          <Kpi label="Failed" value={(totals?.failed ?? 0).toLocaleString()} helper={`${rates?.failureRate ?? 0}% failure`} />
          <Kpi label="Reply Rate" value={`${rates?.responseRate ?? 0}%`} helper={`${totals?.replies ?? 0} replies`} />
          <Kpi label="Conversion Rate" value={`${conversionRate}%`} helper={`${totals?.wonDeals ?? 0} won deals`} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <ChartPanel title="Messages over time">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={messagesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sent" stroke="#2563eb" fill="#dbeafe" />
                <Area type="monotone" dataKey="read" stroke="#10b981" fill="#dcfce7" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel title="Campaign performance">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="delivered" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="replies" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel title="Reply rate trend">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={replyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
          <ChartPanel title="CRM conversion funnel">
            <ResponsiveContainer width="100%" height={280}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnel} isAnimationActive>
                  {funnel.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </ChartPanel>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
          <div className="flex items-center gap-3 border-b border-blue-100 p-5">
            <TrendingUp className="h-5 w-5 text-royal" />
            <h2 className="text-lg font-black text-ink">Template And Draft Planning Notes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left">
              <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500">
                <tr>{["Template", "Audience", "Draft Status", "Planning Note", "Phase"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {topRows.map((row) => <tr key={row[0]} className="text-sm font-semibold text-slate-600">{row.map((cell) => <td key={cell} className="px-4 py-4">{cell}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </DataState>
    </AppShell>
  );
}

function Kpi({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-[22px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <p className="text-xs font-black uppercase text-royal">{label}</p>
      <p className="mt-3 text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <h2 className="mb-4 text-lg font-black text-ink">{title}</h2>
      {children}
    </section>
  );
}
