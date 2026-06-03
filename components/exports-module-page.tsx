"use client";

import { useMemo, useState } from "react";
import { Download, FileDown, ShieldAlert } from "lucide-react";
import { AppShell } from "./app-shell";
import { inputClassName, primaryButtonClassName } from "./saas-page-utils";

const exportCards = [
  {
    title: "Contacts CSV",
    description: "Names, phone numbers, emails, status, tags, and timestamps for the current workspace.",
    href: "/api/exports/contacts",
    button: "Download Contacts"
  },
  {
    title: "Billing Records CSV",
    description: "Manual payment records for the current workspace. Card data and gateway secrets are not stored or exported.",
    href: "/api/exports/billing",
    button: "Download Billing Records"
  }
];

export function ExportsModulePage() {
  const [filters, setFilters] = useState({
    channel: "ALL",
    direction: "ALL",
    status: "ALL"
  });

  const messageLogsHref = useMemo(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== "ALL") {
        params.set(key, value);
      }
    }

    const query = params.toString();
    return `/api/exports/message-logs${query ? `?${query}` : ""}`;
  }, [filters]);

  return (
    <AppShell>
      <main className="space-y-6">
        <section className="rounded-[24px] border border-blue-100 bg-white p-6 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-electric">Data Exports</p>
              <h1 className="mt-2 text-3xl font-black text-ink">Data Exports</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Export current workspace data as CSV files. Tokens, secrets, cookies, raw sessions, and raw webhook payloads are not exported.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
              <div className="flex gap-2">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Exports contain business/customer data. Share carefully.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {exportCards.map((card) => (
            <ExportCard key={card.title} {...card} />
          ))}

          <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-panel">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-royal">
                <FileDown className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-ink">Message Logs CSV</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Provider-backed message logs with safe body preview and provider error summary only.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <FilterSelect label="Channel" value={filters.channel} options={["ALL", "WHATSAPP", "MESSENGER"]} onChange={(value) => setFilters((current) => ({ ...current, channel: value }))} />
              <FilterSelect label="Direction" value={filters.direction} options={["ALL", "INBOUND", "OUTBOUND"]} onChange={(value) => setFilters((current) => ({ ...current, direction: value }))} />
              <FilterSelect label="Status" value={filters.status} options={["ALL", "SENT", "FAILED", "RECEIVED", "ATTEMPTED"]} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
            </div>

            <a className={`${primaryButtonClassName} mt-5 w-full`} href={messageLogsHref}>
              <Download className="h-4 w-4" />
              Download Message Logs
            </a>
          </div>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-white p-5 text-sm leading-6 text-slate-600 shadow-panel">
          <p className="font-bold text-ink">Export rules</p>
          <p className="mt-2">Exports are scoped to the current workspace/company. CSV is the only export format in this phase.</p>
          <p className="mt-2">Do not upload export files to public links. Share only with approved operators or clients.</p>
        </section>
      </main>
    </AppShell>
  );
}

function ExportCard({ title, description, href, button }: { title: string; description: string; href: string; button: string }) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-panel">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-royal">
          <FileDown className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <a className={`${primaryButtonClassName} mt-5 w-full`} href={href}>
        <Download className="h-4 w-4" />
        {button}
      </a>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
      {label}
      <select className={`${inputClassName} w-full normal-case tracking-normal`} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
