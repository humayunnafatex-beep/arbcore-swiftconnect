"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ClipboardList, RefreshCw, Search, Send, XCircle } from "lucide-react";
import { AppShell } from "./app-shell";
import {
  DataState,
  EmptyState,
  Toast,
  formatDate,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  useToast
} from "./saas-page-utils";

type WhatsAppLogMessage = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: string;
  phone: string;
  bodyPreview: string;
  status: string;
  providerMessageId: string | null;
  providerMessageType: string;
  providerMetadataSummary: string;
  providerStatus: string | null;
  errorMessage: string | null;
  mediaId: string;
  mediaType: string;
  mediaMimeType: string;
  mediaFilename: string;
  createdAt: string;
};

type WhatsAppWebhookEvent = {
  id: string;
  provider: string;
  eventType: string;
  summary: string;
  createdAt: string;
};

type WhatsAppLogsResponse =
  | {
      success: true;
      data: {
        messages: WhatsAppLogMessage[];
        webhookEvents: WhatsAppWebhookEvent[];
      };
    }
  | { success: false; error: string };

export function WhatsAppLogsModulePage() {
  const { toast, showToast } = useToast();
  const [messages, setMessages] = useState<WhatsAppLogMessage[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WhatsAppWebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    channel: "ALL",
    direction: "ALL",
    status: "ALL",
    search: "",
    limit: "50"
  });

  async function loadLogs() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        channel: filters.channel,
        direction: filters.direction,
        status: filters.status,
        limit: filters.limit
      });

      if (filters.search.trim()) {
        params.set("search", filters.search.trim());
      }

      const response = await fetch(`/api/whatsapp/logs?${params.toString()}`);
      const result = (await response.json()) as WhatsAppLogsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.success ? "Failed to load WhatsApp logs." : result.error);
      }

      setMessages(result.data.messages);
      setWebhookEvents(result.data.webhookEvents);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to load WhatsApp logs.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  function clearFilters() {
    setFilters({
      channel: "ALL",
      direction: "ALL",
      status: "ALL",
      search: "",
      limit: "50"
    });
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <ClipboardList className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Channel Testing</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">WhatsApp / Messenger Logs</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Verify outbound sends, inbound webhooks, and provider errors without checking the database manually.</p>
              <p className="mt-2 max-w-3xl text-xs font-bold leading-5 text-slate-500">INBOUND means a customer messaged the connected provider number or Page. OUTBOUND means ARBCore sent through the configured provider.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButtonClassName} onClick={() => void loadLogs()} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link href="/send-messages" className={primaryButtonClassName}>
              <Send className="h-4 w-4" />
              Send Test
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-blue-50 p-5 text-sm font-semibold leading-6 text-slate-600 shadow-panel">
        <p className="font-black text-royal">Connected channel reminder</p>
        <p className="mt-1">ARBCore receives WhatsApp messages only for the number connected to the saved Meta Phone Number ID. Messenger logs appear only after a Facebook Page webhook is configured and receives Page messages.</p>
        <p className="mt-1">Messenger messages are identified by Facebook PSID, not phone number.</p>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[160px_160px_160px_1fr_120px_auto_auto]">
          <FilterSelect label="Channel" value={filters.channel} options={["ALL", "WHATSAPP", "MESSENGER"]} onChange={(value) => setFilters({ ...filters, channel: value })} />
          <FilterSelect label="Direction" value={filters.direction} options={["ALL", "INBOUND", "OUTBOUND"]} onChange={(value) => setFilters({ ...filters, direction: value })} />
          <FilterSelect label="Status" value={filters.status} options={["ALL", "SENT", "FAILED", "RECEIVED", "ATTEMPTED"]} onChange={(value) => setFilters({ ...filters, status: value })} />
          <label className="grid gap-1.5 text-xs font-black text-slate-500">
            Search
            <span className="flex h-11 items-center gap-2 rounded-[14px] border border-blue-100 bg-white px-3 focus-within:border-royal focus-within:ring-4 focus-within:ring-blue-100">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="phone, PSID, message, provider ID"
              />
            </span>
          </label>
          <FilterSelect label="Limit" value={filters.limit} options={["25", "50", "100"]} onChange={(value) => setFilters({ ...filters, limit: value })} />
          <button className={`${primaryButtonClassName} w-full self-end sm:w-auto`} onClick={() => void loadLogs()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Apply
          </button>
          <button className={`${secondaryButtonClassName} w-full self-end sm:w-auto`} onClick={clearFilters} disabled={loading}>
            <XCircle className="h-4 w-4" />
            Clear
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-ink">Recent Message Logs</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Latest 50 safe WhatsApp and Messenger message log entries.</p>
            </div>
          </div>

          <DataState loading={loading} error={error} empty={!messages.length} emptyText="No message logs match the current filters. Clear filters or run a channel test.">
            <div className="space-y-3">
              {messages.map((message) => (
                <article key={message.id} className="rounded-[18px] border border-blue-100 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase text-royal ring-1 ring-blue-100">{message.channel}</span>
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase text-cyan-700 ring-1 ring-cyan-100">{message.direction}</span>
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black uppercase text-slate-600 ring-1 ring-slate-100">{message.status}</span>
                        {message.mediaType ? (
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black uppercase text-violet-700 ring-1 ring-violet-100">
                            Inbound media: {message.mediaType}
                          </span>
                        ) : null}
                        {isUnsupportedMessage(message) ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black uppercase text-amber-700 ring-1 ring-amber-100">
                            Unsupported
                          </span>
                        ) : null}
                        <span className="text-xs font-bold text-slate-400">{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="mt-3 text-sm font-black text-ink">{message.phone || "No phone recorded"}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{message.bodyPreview || "No message body recorded."}</p>
                    </div>
                    <div className="min-w-0 rounded-[16px] bg-blue-50 p-3 text-xs font-semibold text-slate-600 lg:w-72">
                      <p><span className="font-black text-royal">Channel:</span> {message.channel}</p>
                      <p className="mt-1 break-all"><span className="font-black text-royal">Provider ID:</span> {message.providerMessageId || "-"}</p>
                      {message.providerMessageType ? (
                        <p className="mt-1"><span className="font-black text-royal">Message Type:</span> {message.providerMessageType}</p>
                      ) : null}
                      <p className="mt-1"><span className="font-black text-royal">Provider Status:</span> {message.providerStatus || "-"}</p>
                      {message.mediaType ? (
                        <p className="mt-1"><span className="font-black text-royal">Media:</span> {message.mediaType}{message.mediaMimeType ? ` (${message.mediaMimeType})` : ""}</p>
                      ) : null}
                      {message.providerMetadataSummary ? (
                        <p className="mt-2 rounded-[12px] bg-amber-50 p-2 text-amber-800">
                          <span className="font-black">Safe summary:</span> {message.providerMetadataSummary}
                        </p>
                      ) : null}
                      {message.errorMessage ? (
                        <p className="mt-2 flex gap-2 rounded-[12px] bg-rose-50 p-2 text-rose-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 break-words">{message.errorMessage}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </DataState>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
          <h2 className="text-base font-black text-ink">Recent Webhook Events</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Latest 20 WhatsApp and Messenger webhook summaries.</p>

          <DataState loading={loading} error={error} empty={!webhookEvents.length} emptyText="No webhook events yet. Send a WhatsApp message or Messenger Page message after Meta webhook setup.">
            <div className="mt-4 space-y-3">
              {webhookEvents.map((event) => (
                <article key={event.id} className="rounded-[18px] border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase text-royal ring-1 ring-blue-100">{event.eventType}</span>
                    <span className="text-xs font-bold text-slate-400">{formatDate(event.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{event.summary}</p>
                </article>
              ))}
            </div>
          </DataState>

          {!loading && !error && !messages.length && !webhookEvents.length ? (
            <div className="mt-4">
              <EmptyState text="Use Send Messages for outbound WhatsApp testing, then send a WhatsApp or Messenger message to the connected channel for inbound webhook testing." />
            </div>
          ) : null}
        </section>
      </section>

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function isUnsupportedMessage(message: WhatsAppLogMessage) {
  return message.channel === "WHATSAPP" && message.bodyPreview.startsWith("[unsupported:");
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-slate-500">
      {label}
      <select className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
