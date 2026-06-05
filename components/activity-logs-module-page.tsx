"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import { DataState, formatDate, inputClassName, secondaryButtonClassName } from "./saas-page-utils";

type ActivityLog = {
  id: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  summary: string;
  metadataSummary: string;
  createdAt: string;
};

type ActivityLogsResponse =
  | { success: true; data: { logs: ActivityLog[] } }
  | { success: false; error: string };

const entityTypes = ["ALL", "CONTACT", "CONVERSATION", "ORDER", "PRODUCT", "SAVED_REPLY", "AUTO_REPLY_RULE"];
const limits = ["50", "100", "250", "500"];

export function ActivityLogsModulePage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entityType, setEntityType] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState("100");

  const actionOptions = useMemo(() => {
    const values = Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort();
    return ["ALL", ...values];
  }, [logs]);

  useEffect(() => {
    void loadLogs();
  }, [entityType, action, limit]);

  async function loadLogs() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit });
      if (entityType !== "ALL") params.set("entityType", entityType);
      if (action !== "ALL") params.set("action", action);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/activity-logs?${params.toString()}`, { cache: "no-store" });
      const json = await response.json().catch(() => null) as ActivityLogsResponse | null;

      if (!response.ok || !json?.success) {
        throw new Error(getApiErrorMessage(json) || "Failed to load activity logs.");
      }

      setLogs(json.data.logs);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[24px] border border-blue-100 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-electric">Internal audit trail</p>
              <h1 className="mt-2 text-3xl font-black text-royal">Activity Logs</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Safe internal summaries of manual staff actions. Tokens, webhook payloads, cookies, and secrets are never displayed.
              </p>
            </div>
            <button type="button" className={secondaryButtonClassName} onClick={() => void loadLogs()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-soft">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <select className={inputClassName} value={entityType} onChange={(event) => setEntityType(event.target.value)}>
              {entityTypes.map((item) => <option key={item} value={item}>{item === "ALL" ? "All entities" : item}</option>)}
            </select>
            <select className={inputClassName} value={action} onChange={(event) => setAction(event.target.value)}>
              {actionOptions.map((item) => <option key={item} value={item}>{item === "ALL" ? "All actions" : item}</option>)}
            </select>
            <select className={inputClassName} value={limit} onChange={(event) => setLimit(event.target.value)}>
              {limits.map((item) => <option key={item} value={item}>Latest {item}</option>)}
            </select>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1 md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClassName} pl-9`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void loadLogs();
                  }}
                  placeholder="Search activity"
                />
              </div>
              <button type="button" className={secondaryButtonClassName} onClick={() => void loadLogs()}>
                Search
              </button>
            </div>
          </div>
        </section>

        <DataState
          loading={loading}
          error={error || null}
          empty={!logs.length}
          emptyText="Manual actions will appear here after staff create or update records."
        >
          <section className="grid gap-3">
            {logs.map((log) => (
              <article key={log.id} className="rounded-[18px] border border-blue-100 bg-white p-4 shadow-soft">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal">
                        <ClipboardList className="h-3.5 w-3.5" />
                        {log.action}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{log.entityType}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-black text-slate-900">{log.entityLabel || log.entityId || "Unlabeled item"}</h2>
                    <p className="mt-1 text-sm text-slate-600">{log.summary || "Activity recorded."}</p>
                    {log.metadataSummary ? <p className="mt-1 text-xs font-semibold text-slate-500">{log.metadataSummary}</p> : null}
                  </div>
                  <div className="shrink-0 text-left text-xs text-slate-500 lg:text-right">
                    <p className="font-bold text-slate-700">{log.actorName || "Beta Operator"}</p>
                    <p>{log.actorRole || "Operator"}{log.actorEmail ? ` - ${log.actorEmail}` : ""}</p>
                    <p className="mt-2">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </DataState>
      </div>
    </AppShell>
  );
}
