"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, RefreshCw, Send, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { apiRequest, getApiErrorMessage, type ListResponse } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import { DataState, Toast, formatDate, inputClassName, primaryButtonClassName, secondaryButtonClassName, textareaClassName, useApiData, useToast } from "./saas-page-utils";

type WhatsAppAccount = {
  id: string;
  label: string;
  phoneNumber: string;
  businessName: string | null;
  status: string;
  qualityRating: string;
  dailyLimit: number;
  messagesUsed24h: number;
  lastSyncedAt: string | null;
};

type WhatsAppStatus = {
  configured: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  apiVersion: string;
  hasAccessToken: boolean;
  hasVerifyToken: boolean;
  hasAppSecret: boolean;
  webhookStatus: string;
};

export function ConnectModulePage() {
  const accounts = useApiData<ListResponse<WhatsAppAccount>>("/api/whatsapp/accounts?pageSize=50");
  const status = useApiData<WhatsAppStatus>("/api/whatsapp/test-send");
  const { toast, showToast } = useToast();
  const [form, setForm] = useState({ to: "", body: "Hello from ARBCore SwiftConnect sandbox test." });
  const [sending, setSending] = useState(false);

  async function sendTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    try {
      const result = await apiRequest<{ sent: boolean; provider: string; errorMessage?: string }>("/api/whatsapp/test-send", {
        method: "POST",
        body: JSON.stringify(form)
      });
      showToast(result.sent ? `Test message sent via ${result.provider}.` : result.errorMessage ?? "Test message was not sent.", result.sent ? "success" : "error");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
            <MessageCircle className="h-8 w-8" />
          </span>
          <div>
            <p className="text-xs font-black uppercase text-royal">Connection Hub</p>
            <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">WhatsApp Cloud API Sandbox</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Monitor official Meta Cloud API environment readiness and send a local sandbox test message.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-ink">Connected Numbers</h2>
            <button className={secondaryButtonClassName} onClick={() => accounts.reload()}><RefreshCw className="h-4 w-4" />Refresh</button>
          </div>
          <DataState loading={accounts.loading} error={accounts.error} empty={!accounts.data?.items.length} emptyText="No WhatsApp account records yet.">
            <div className="grid gap-3">
              {(accounts.data?.items ?? []).map((account) => (
                <article key={account.id} className="rounded-[18px] border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-base font-black text-ink">{account.label}</p>
                      <p className="text-sm font-semibold text-slate-500">{account.phoneNumber} - {account.businessName ?? "Business"}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-royal ring-1 ring-blue-100">{account.status}</span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Info label="Quality" value={account.qualityRating} />
                    <Info label="Daily usage" value={`${account.messagesUsed24h} / ${account.dailyLimit}`} />
                    <Info label="Last sync" value={formatDate(account.lastSyncedAt)} />
                  </div>
                </article>
              ))}
            </div>
          </DataState>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-blue-50 text-royal ring-1 ring-blue-100"><Wifi className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-black text-ink">Environment Status</h2>
                <p className="text-xs font-semibold text-slate-500">Official Cloud API sandbox config</p>
              </div>
            </div>
            <DataState loading={status.loading} error={status.error} empty={!status.data} emptyText="No environment status available.">
              {status.data ? (
                <div className="mt-4 space-y-3">
                  <Info label="Configured" value={status.data.configured ? "Configured" : "Not configured"} />
                  <Info label="Phone Number ID" value={status.data.phoneNumberId || "Missing"} />
                  <Info label="Business Account ID" value={status.data.businessAccountId || "Missing"} />
                  <Info label="API Version" value={status.data.apiVersion} />
                  <Info label="Webhook" value={status.data.webhookStatus} />
                  <Info label="App Secret" value={status.data.hasAppSecret ? "Configured" : "Missing"} />
                </div>
              ) : null}
            </DataState>
          </section>

          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
            <div className="mb-4 flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-royal" />
              <h2 className="text-lg font-black text-ink">Send Test Message</h2>
            </div>
            <form className="space-y-3" onSubmit={(event) => void sendTest(event)}>
              <input className={`${inputClassName} w-full`} value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} placeholder="Recipient phone, e.g. 8801712345678" />
              <textarea className={`${textareaClassName} w-full`} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
              <button className={`${primaryButtonClassName} w-full`} disabled={sending}><Send className="h-4 w-4" />{sending ? "Sending..." : "Send Test"}</button>
            </form>
            <p className="mt-3 flex gap-2 rounded-[16px] bg-blue-50 p-3 text-xs font-semibold text-slate-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-royal" />
              Uses official Meta WhatsApp Cloud API only when env variables are configured; otherwise logs a mock send.
            </p>
          </section>
        </aside>
      </section>
      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white px-3 py-2 ring-1 ring-blue-100">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="truncate text-xs font-black text-ink">{value}</span>
    </div>
  );
}
