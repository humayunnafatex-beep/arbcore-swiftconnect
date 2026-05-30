"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, MessageCircle, MessageSquareText, Send, TrendingUp, Users } from "lucide-react";
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
  connectedNumbers: number;
  messagesSentToday: number;
  totalMessages: number;
  openConversations: number;
  activeCampaigns: number;
  contacts: number;
  activeAutoReplyRules: number;
  teamMembers: number;
  aiCreditsUsed: number;
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
        helper: `${stats.activeCampaigns.toLocaleString()} active campaign(s)`
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
    </div>
  );
}
