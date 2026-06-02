"use client";

import Link from "next/link";
import { AlertTriangle, Building2, Cable, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell } from "./app-shell";
import { DataState, primaryButtonClassName, secondaryButtonClassName, useApiData } from "./saas-page-utils";

type DuplicateProviderId = {
  providerIdMasked: string;
  workspaceCount: number;
  workspaces: Array<{
    id: string;
    name: string;
    plan: string;
  }>;
};

type ProviderDiagnostics = {
  strictProviderRouting: boolean;
  summary: {
    workspaceCount: number;
    whatsappProviderIdsPresent: number;
    messengerProviderIdsPresent: number;
    duplicateWhatsappPhoneNumberIds: number;
    duplicateMessengerPageIds: number;
  };
  duplicates: {
    whatsappPhoneNumberIds: DuplicateProviderId[];
    messengerPageIds: DuplicateProviderId[];
  };
  warnings: string[];
};

export function AdminProviderDiagnosticsModulePage() {
  const diagnostics = useApiData<ProviderDiagnostics>("/api/admin/provider-diagnostics");
  const data = diagnostics.data;

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <ShieldCheck className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Admin Diagnostics</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Provider Diagnostics</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Check provider ID uniqueness readiness before strict multi-client webhook routing. Settings now blocks duplicate WhatsApp Phone Number IDs and Messenger Page IDs across workspaces. Tokens are never shown.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={() => diagnostics.reload()} disabled={diagnostics.loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <DataState loading={diagnostics.loading} error={diagnostics.error} empty={!data} emptyText="No provider diagnostics are available yet.">
        {data ? (
          <>
            <section className={`rounded-[24px] border p-5 text-sm font-bold leading-6 shadow-panel ${data.strictProviderRouting ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-100 bg-amber-50 text-amber-800"}`}>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">Strict provider routing: {data.strictProviderRouting ? "On" : "Off"}</p>
                  <p className="mt-1">{data.strictProviderRouting ? "Unmatched provider webhooks are not processed into the default workspace." : "Enterprise Beta fallback is active for unmatched provider webhooks."}</p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Metric label="Workspaces" value={data.summary.workspaceCount.toLocaleString()} />
              <Metric label="WhatsApp IDs" value={data.summary.whatsappProviderIdsPresent.toLocaleString()} />
              <Metric label="Messenger IDs" value={data.summary.messengerProviderIdsPresent.toLocaleString()} />
              <Metric label="WhatsApp Duplicates" value={data.summary.duplicateWhatsappPhoneNumberIds.toLocaleString()} tone={data.summary.duplicateWhatsappPhoneNumberIds ? "warn" : "ok"} />
              <Metric label="Messenger Duplicates" value={data.summary.duplicateMessengerPageIds.toLocaleString()} tone={data.summary.duplicateMessengerPageIds ? "warn" : "ok"} />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <DuplicateSection title="WhatsApp duplicate Phone Number IDs" items={data.duplicates.whatsappPhoneNumberIds} />
              <DuplicateSection title="Messenger duplicate Page IDs" items={data.duplicates.messengerPageIds} />
            </section>

            <section className="rounded-[24px] border border-amber-100 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-800 shadow-panel">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">Warnings</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {(data.warnings.length ? data.warnings : ["No duplicate provider IDs detected. Empty provider IDs are ignored."]).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="flex flex-wrap gap-2">
              <Link href="/admin/workspaces" className={primaryButtonClassName}>
                <Building2 className="h-4 w-4" />
                Admin Workspaces
              </Link>
              <Link href="/channels" className={secondaryButtonClassName}>
                <Cable className="h-4 w-4" />
                Channel Center
              </Link>
              <span className="inline-flex min-h-11 items-center rounded-[14px] border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-slate-600">
                Docs: STRICT_PROVIDER_WEBHOOK_ROUTING.md
              </span>
            </section>
          </>
        ) : null}
      </DataState>
    </AppShell>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "ok" | "warn" }) {
  const toneClass = tone === "warn" ? "text-amber-700" : tone === "ok" ? "text-emerald-700" : "text-ink";

  return (
    <article className="rounded-[22px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <p className="text-xs font-black uppercase text-royal">{label}</p>
      <p className={`mt-3 text-3xl font-black ${toneClass}`}>{value}</p>
    </article>
  );
}

function DuplicateSection({ title, items }: { title: string; items: DuplicateProviderId[] }) {
  return (
    <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <h2 className="text-lg font-black text-ink">{title}</h2>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.providerIdMasked} className="rounded-[18px] bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-ink">{item.providerIdMasked}</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">{item.workspaceCount} workspaces</span>
              </div>
              <div className="mt-3 grid gap-2">
                {item.workspaces.map((workspace) => (
                  <div key={workspace.id} className="rounded-[14px] bg-white px-3 py-2 text-sm font-bold text-slate-600">
                    {workspace.name} · {labelize(workspace.plan)}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-[18px] bg-emerald-50 p-4 text-sm font-bold text-emerald-700">No duplicates detected.</p>
      )}
    </section>
  );
}

function labelize(value: string) {
  return value.toLowerCase().split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
