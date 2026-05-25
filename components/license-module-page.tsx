"use client";

import { CheckCircle2, CreditCard, Download, Gauge, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { AppShell } from "./app-shell";
import { primaryButtonClassName, secondaryButtonClassName } from "./saas-page-utils";

const usage = [
  { label: "Message usage", used: 28420, total: 100000, icon: Gauge },
  { label: "AI credit usage", used: 48500, total: 100000, icon: TrendingUp },
  { label: "Team member usage", used: 8, total: 25, icon: Users }
];

const invoices = [
  ["INV-2026-005", "May 2026", "BDT 35,000", "Paid"],
  ["INV-2026-004", "Apr 2026", "BDT 35,000", "Paid"],
  ["INV-2026-003", "Mar 2026", "BDT 35,000", "Paid"]
];

export function LicenseModulePage() {
  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <ShieldCheck className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">License and Usage</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Subscription</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Monitor plan, quotas, renewal, billing history, and operational status for the local MVP workspace.</p>
            </div>
          </div>
          <button className={primaryButtonClassName}>Upgrade Plan</button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <article className="rounded-[24px] border border-blue-100 bg-white/95 p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-royal">Current Plan</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Enterprise</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Active</span>
          </div>
          <p className="mt-5 text-sm font-semibold leading-6 text-slate-500">Includes 100,000 monthly messages, 100,000 AI credits, 25 team seats, and priority local workspace support.</p>
          <div className="mt-6 grid gap-3">
            <Info label="Renewal date" value="30 Jun 2026" />
            <Info label="Monthly billing" value="BDT 35,000" />
            <Info label="Payment method" value="Manual invoice" />
          </div>
        </article>

        <div className="grid gap-4 md:grid-cols-3">
          {usage.map((item) => {
            const Icon = item.icon;
            const percent = Math.round((item.used / item.total) * 100);
            return (
              <article key={item.label} className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
                <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-blue-50 text-royal ring-1 ring-blue-100">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-5 text-sm font-black text-ink">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-ink">{item.used.toLocaleString()} / {item.total.toLocaleString()}</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-royal to-electric" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">{percent}% used</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
          <div className="flex items-center justify-between gap-3 border-b border-blue-100 p-5">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-royal" />
              <h2 className="text-lg font-black text-ink">Invoice & Payment History</h2>
            </div>
            <button className={secondaryButtonClassName}><Download className="h-4 w-4" />Download</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left">
              <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500">
                <tr>{["Invoice", "Period", "Amount", "Status"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {invoices.map((row) => <tr key={row[0]} className="text-sm font-semibold text-slate-600">{row.map((cell) => <td key={cell} className="px-4 py-4">{cell}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="text-lg font-black text-ink">API Status</h2>
                <p className="text-sm font-semibold text-emerald-700">Operational</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <Info label="Local API" value="Operational" />
              <Info label="WhatsApp API" value="Not connected" />
              <Info label="OpenAI API" value="Mock mode" />
              <Info label="Payment gateway" value="Not connected" />
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] bg-blue-50 px-4 py-3">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-sm font-black text-ink">{value}</span>
    </div>
  );
}
