"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ClipboardList, RefreshCw, Send } from "lucide-react";
import { AppShell } from "./app-shell";
import {
  DataState,
  EmptyState,
  Toast,
  formatDate,
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
  providerStatus: string | null;
  errorMessage: string | null;
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

  async function loadLogs() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/whatsapp/logs");
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

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <ClipboardList className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">WhatsApp Testing</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">WhatsApp Logs</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Verify outbound sends, inbound webhooks, and provider errors without checking the database manually.</p>
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

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-ink">Recent WhatsApp Message Logs</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Latest 50 safe message log entries.</p>
            </div>
          </div>

          <DataState loading={loading} error={error} empty={!messages.length} emptyText="No WhatsApp message logs yet. Use Send Messages to run an outbound test.">
            <div className="space-y-3">
              {messages.map((message) => (
                <article key={message.id} className="rounded-[18px] border border-blue-100 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase text-royal ring-1 ring-blue-100">{message.direction}</span>
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black uppercase text-slate-600 ring-1 ring-slate-100">{message.status}</span>
                        <span className="text-xs font-bold text-slate-400">{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="mt-3 text-sm font-black text-ink">{message.phone || "No phone recorded"}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{message.bodyPreview || "No message body recorded."}</p>
                    </div>
                    <div className="min-w-0 rounded-[16px] bg-blue-50 p-3 text-xs font-semibold text-slate-600 lg:w-72">
                      <p><span className="font-black text-royal">Channel:</span> {message.channel}</p>
                      <p className="mt-1 truncate"><span className="font-black text-royal">Provider ID:</span> {message.providerMessageId || "-"}</p>
                      <p className="mt-1"><span className="font-black text-royal">Provider Status:</span> {message.providerStatus || "-"}</p>
                      {message.errorMessage ? (
                        <p className="mt-2 flex gap-2 rounded-[12px] bg-rose-50 p-2 text-rose-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{message.errorMessage}</span>
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
          <p className="mt-1 text-xs font-semibold text-slate-500">Latest 20 WhatsApp webhook summaries.</p>

          <DataState loading={loading} error={error} empty={!webhookEvents.length} emptyText="No WhatsApp webhook events yet. Send a WhatsApp message to the connected business number after Meta webhook setup.">
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
              <EmptyState text="Use Send Messages for outbound testing, then send a WhatsApp message to the connected number for inbound webhook testing." />
            </div>
          ) : null}
        </section>
      </section>

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}
