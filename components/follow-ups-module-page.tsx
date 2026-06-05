"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, RefreshCw, Search } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import { DataState, Toast, formatDate, inputClassName, primaryButtonClassName, secondaryButtonClassName, useToast } from "./saas-page-utils";

type FollowUpBucket = "OVERDUE" | "TODAY" | "UPCOMING" | "DONE";
type FollowUpItem = {
  id: string;
  sourceType: "CONVERSATION" | "ORDER";
  sourceId: string;
  customerName: string;
  contactKey: string;
  channel: string;
  followUpAt: string | null;
  followUpDone: boolean;
  priority: string;
  status: string;
  bucket: FollowUpBucket;
  relatedLabel: string;
  inboxHref: string | null;
  orderHref: string | null;
};

type FollowUpsResponse = {
  success: boolean;
  data?: {
    items: FollowUpItem[];
    counts: {
      overdue: number;
      today: number;
      upcoming: number;
      done: number;
    };
  };
  error?: string;
};

const statusOptions = ["ALL", "OVERDUE", "TODAY", "UPCOMING", "DONE"];
const sourceOptions = ["ALL", "CONVERSATION", "ORDER"];

export function FollowUpsModulePage() {
  const { toast, showToast } = useToast();
  const initial = getInitialFilters();
  const [status, setStatus] = useState(initial.status);
  const [source, setSource] = useState(initial.source);
  const [search, setSearch] = useState(initial.search);
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [counts, setCounts] = useState({ overdue: 0, today: 0, upcoming: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftDates, setDraftDates] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "200" });
    if (status !== "ALL") params.set("status", status);
    if (source !== "ALL") params.set("source", source);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [status, source, search]);

  useEffect(() => {
    void loadFollowUps();
  }, [query]);

  async function loadFollowUps() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/follow-ups?${query}`, { cache: "no-store" });
      const result = (await response.json().catch(() => null)) as FollowUpsResponse | null;

      if (!response.ok || !result?.success || !result.data) {
        throw new Error(result?.error || "Failed to load follow-up queue.");
      }

      setItems(result.data.items);
      setCounts(result.data.counts);
      setDraftDates(Object.fromEntries(result.data.items.map((item) => [draftKey(item), toDateTimeLocal(item.followUpAt)])));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function updateFollowUp(item: FollowUpItem, patch: { followUpAt?: string | null; followUpDone?: boolean }) {
    setSavingId(draftKey(item));
    try {
      const response = await fetch("/api/follow-ups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: item.sourceType,
          id: item.sourceId,
          ...patch
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to update follow-up.");
      }

      showToast("Follow-up updated. No customer message was sent.");
      await loadFollowUps();
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppShell>
      <main className="space-y-6">
        <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
                <CalendarClock className="h-8 w-8" />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-royal">Daily operations</p>
                <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Follow-up Queue</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Review overdue, today, upcoming, and completed conversation/order follow-ups. This queue never sends automatic messages.
                </p>
              </div>
            </div>
            <button className={primaryButtonClassName} type="button" onClick={() => void loadFollowUps()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Overdue" value={counts.overdue} icon={<AlertTriangle className="h-5 w-5" />} tone="red" />
          <SummaryCard label="Today" value={counts.today} icon={<Clock className="h-5 w-5" />} tone="blue" />
          <SummaryCard label="Upcoming" value={counts.upcoming} icon={<CalendarClock className="h-5 w-5" />} tone="purple" />
          <SummaryCard label="Done" value={counts.done} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
          <div className="grid gap-3 lg:grid-cols-[180px_180px_1fr]">
            <select className={inputClassName} value={status} onChange={(event) => setStatus(event.target.value)}>
              {statusOptions.map((option) => <option key={option} value={option}>{option === "ALL" ? "All follow-ups" : option}</option>)}
            </select>
            <select className={inputClassName} value={source} onChange={(event) => setSource(event.target.value)}>
              {sourceOptions.map((option) => <option key={option} value={option}>{option === "ALL" ? "All sources" : option}</option>)}
            </select>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input className={`${inputClassName} w-full pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, phone/PSID, order, channel" />
            </label>
          </div>
        </section>

        <DataState loading={loading} error={error} empty={!items.length} emptyText="No follow-ups match this view.">
          <section className="grid gap-3">
            {items.map((item) => {
              const key = draftKey(item);
              const saving = savingId === key;

              return (
                <article key={key} className="rounded-[22px] border border-blue-100 bg-white p-4 shadow-panel">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill bucket={item.bucket} />
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal">{item.sourceType}</span>
                        {item.priority ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.priority}</span> : null}
                      </div>
                      <h2 className="mt-3 text-lg font-black text-ink">{item.customerName || item.contactKey || "Unknown customer"}</h2>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-500">{item.channel} - {item.contactKey || "No contact key"}</p>
                      <p className="mt-2 text-sm font-bold text-slate-700">{item.relatedLabel}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Follow-up: {item.followUpAt ? formatDate(item.followUpAt) : "No date"} - {item.followUpDone ? "Done" : "Open"}
                      </p>
                    </div>

                    <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:w-[520px]">
                      <input
                        className={inputClassName}
                        type="datetime-local"
                        value={draftDates[key] ?? ""}
                        onChange={(event) => setDraftDates((current) => ({ ...current, [key]: event.target.value }))}
                      />
                      <button className={secondaryButtonClassName} type="button" onClick={() => void updateFollowUp(item, { followUpAt: draftDates[key] || null, followUpDone: false })} disabled={saving}>
                        {saving ? "Saving..." : "Update Date"}
                      </button>
                      <button className={secondaryButtonClassName} type="button" onClick={() => void updateFollowUp(item, { followUpDone: true })} disabled={saving || item.followUpDone}>
                        <CheckCircle2 className="h-4 w-4" />
                        Mark Done
                      </button>
                      <button className={secondaryButtonClassName} type="button" onClick={() => void updateFollowUp(item, { followUpDone: false })} disabled={saving || !item.followUpDone}>
                        Reopen
                      </button>
                      {item.inboxHref ? <Link className={`${primaryButtonClassName} justify-center sm:col-span-1`} href={item.inboxHref}>Open Inbox</Link> : null}
                      {item.orderHref ? <Link className={`${secondaryButtonClassName} justify-center sm:col-span-1`} href={item.orderHref}>Open Order</Link> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </DataState>
      </main>
      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "red" | "blue" | "purple" | "green" }) {
  const toneClass = {
    red: "bg-rose-50 text-rose-700 ring-rose-100",
    blue: "bg-blue-50 text-royal ring-blue-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100"
  }[tone];

  return (
    <div className="rounded-[22px] border border-blue-100 bg-white p-4 shadow-panel">
      <div className={`grid h-11 w-11 place-items-center rounded-[14px] ring-1 ${toneClass}`}>{icon}</div>
      <p className="mt-3 text-2xl font-black text-ink">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function StatusPill({ bucket }: { bucket: FollowUpBucket }) {
  const tone = bucket === "OVERDUE"
    ? "bg-rose-50 text-rose-700 ring-rose-100"
    : bucket === "TODAY"
      ? "bg-blue-50 text-royal ring-blue-100"
      : bucket === "DONE"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
        : "bg-violet-50 text-violet-700 ring-violet-100";

  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ring-1 ${tone}`}>{bucket}</span>;
}

function draftKey(item: FollowUpItem) {
  return `${item.sourceType}:${item.sourceId}`;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getInitialFilters() {
  if (typeof window === "undefined") {
    return { status: "ALL", source: "ALL", search: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    status: params.get("status")?.trim().toUpperCase() || "ALL",
    source: params.get("source")?.trim().toUpperCase() || "ALL",
    search: params.get("search")?.trim() || ""
  };
}
