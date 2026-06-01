"use client";

import Link from "next/link";
import { Bot, CheckCircle2, ClipboardList, ExternalLink, MessageCircle, RefreshCw, Send, Settings, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { AppShell } from "./app-shell";
import { DataState, primaryButtonClassName, secondaryButtonClassName, useApiData } from "./saas-page-utils";

type ChannelStatus = {
  whatsapp: {
    configured: boolean;
    phoneNumberIdPresent: boolean;
    accessTokenPresent: boolean;
    verifyTokenPresent: boolean;
    webhookUrl: string | null;
    webhookPath: "/api/whatsapp/webhook";
    sendTestPath: "/send-messages";
    logsPath: "/whatsapp-logs";
  };
  messenger: {
    configured: boolean;
    pageIdPresent: boolean;
    pageAccessTokenPresent: boolean;
    verifyTokenPresent: boolean;
    webhookUrl: string | null;
    webhookPath: "/api/messenger/webhook";
    testSendApiPath: "/api/messenger/test-send";
    logsPath: "/whatsapp-logs";
  };
  autoReply: {
    supportedChannels: string[];
    note: string;
  };
};

export function ChannelsModulePage() {
  const { data, loading, error, reload } = useApiData<ChannelStatus>("/api/channels/status");

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <MessageCircle className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Channel Setup</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Channel Center</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Check WhatsApp and Messenger setup status, webhook paths, test links, and auto-reply readiness without exposing access tokens.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={reload} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <DataState loading={loading} error={error} empty={!data} emptyText="No channel status is available yet.">
        {data ? (
          <>
            <section className="grid gap-4 xl:grid-cols-2">
              <ChannelCard
                title="WhatsApp"
                icon={<Smartphone className="h-6 w-6" />}
                configured={data.whatsapp.configured}
                rows={[
                  ["Phone Number ID present", data.whatsapp.phoneNumberIdPresent],
                  ["Access token present", data.whatsapp.accessTokenPresent],
                  ["Verify token present", data.whatsapp.verifyTokenPresent]
                ]}
                webhookUrl={data.whatsapp.webhookUrl}
                webhookPath={data.whatsapp.webhookPath}
                actions={[
                  { label: "Settings", href: "/settings", icon: Settings },
                  { label: "Send Messages", href: data.whatsapp.sendTestPath, icon: Send },
                  { label: "Logs", href: data.whatsapp.logsPath, icon: ClipboardList }
                ]}
              />

              <ChannelCard
                title="Messenger"
                icon={<MessageCircle className="h-6 w-6" />}
                configured={data.messenger.configured}
                rows={[
                  ["Page ID present", data.messenger.pageIdPresent],
                  ["Page Access Token present", data.messenger.pageAccessTokenPresent],
                  ["Verify token present", data.messenger.verifyTokenPresent]
                ]}
                webhookUrl={data.messenger.webhookUrl}
                webhookPath={data.messenger.webhookPath}
                actions={[
                  { label: "Settings", href: "/settings", icon: Settings },
                  { label: "Logs", href: data.messenger.logsPath, icon: ClipboardList }
                ]}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
              <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-blue-50 text-royal ring-1 ring-blue-100">
                    <Bot className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-ink">Auto Reply Support</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{data.autoReply.note}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {data.autoReply.supportedChannels.map((channel) => (
                    <span key={channel} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-royal ring-1 ring-blue-100">
                      {channel} supported
                    </span>
                  ))}
                </div>
                <p className="mt-4 rounded-[18px] border border-dashed border-blue-200 bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                  Active rules respond only when the channel is configured, an inbound message is received, and the rule keyword matches.
                </p>
              </section>

              <section className="rounded-[24px] border border-amber-100 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-800 shadow-panel">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-black">Safety note</p>
                    <p className="mt-1">Tokens are never displayed. ARBCore does not fake provider success. Check Logs to verify inbound and outbound provider activity.</p>
                  </div>
                </div>
              </section>
            </section>
          </>
        ) : null}
      </DataState>
    </AppShell>
  );
}

function ChannelCard({
  title,
  icon,
  configured,
  rows,
  webhookUrl,
  webhookPath,
  actions
}: {
  title: string;
  icon: React.ReactNode;
  configured: boolean;
  rows: Array<[string, boolean]>;
  webhookUrl: string | null;
  webhookPath: string;
  actions: Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }>;
}) {
  return (
    <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-blue-50 text-royal ring-1 ring-blue-100">{icon}</span>
          <div>
            <h2 className="text-lg font-black text-ink">{title}</h2>
            <p className="mt-1 text-xs font-black uppercase text-slate-500">{configured ? "Configured" : "Not configured"}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${configured ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-rose-50 text-rose-700 ring-rose-100"}`}>
          {configured ? "Ready" : "Needs setup"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map(([label, present]) => (
          <StatusRow key={label} label={label} present={present} />
        ))}
      </div>

      <div className="mt-5 rounded-[18px] bg-blue-50 p-4 text-sm font-semibold text-slate-600">
        <p><span className="font-black text-royal">Webhook path:</span> {webhookPath}</p>
        <p className="mt-1 break-all"><span className="font-black text-royal">Saved URL:</span> {webhookUrl || "Not saved"}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const className = index === 0 ? primaryButtonClassName : secondaryButtonClassName;
          return (
            <Link key={action.label} href={action.href} className={className}>
              <Icon className="h-4 w-4" />
              {action.label}
              {action.href.startsWith("/api/") ? <ExternalLink className="h-3.5 w-3.5" /> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StatusRow({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] bg-blue-50 px-4 py-3">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-sm font-black ${present ? "text-emerald-700" : "text-rose-700"}`}>
        {present ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {present ? "Yes" : "No"}
      </span>
    </div>
  );
}
