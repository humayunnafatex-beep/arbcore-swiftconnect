"use client";

import Link from "next/link";
import { CheckCircle2, CreditCard, Gauge, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { AppShell } from "./app-shell";
import { useApiData } from "./saas-page-utils";
import { primaryButtonClassName, secondaryButtonClassName } from "./saas-page-utils";

const usage = [
  { label: "Message usage", used: 28420, total: 100000, icon: Gauge },
  { label: "AI credit usage", used: 48500, total: 100000, icon: TrendingUp },
  { label: "Team member usage", used: 8, total: 25, icon: Users }
];

export function LicenseModulePage() {
  const { data } = useApiData<{ subscription: { plan: string; status: string; billingMode: string; currentPeriodStart: string | null; currentPeriodEnd: string | null }; created: boolean }>("/api/billing/subscription");
  const subscription = data?.subscription;

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
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Monitor Enterprise Beta status, future plan limits, and operational readiness for client workspaces.</p>
            </div>
          </div>
          <Link href="/billing" className={primaryButtonClassName}>
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <article className="rounded-[24px] border border-blue-100 bg-white/95 p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-royal">Current Plan</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Enterprise Beta</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Beta Active</span>
          </div>
          <p className="mt-5 text-sm font-semibold leading-6 text-slate-500">Includes beta access to workspace modules while billing, subscriptions, and channel-based automation limits are prepared for paid SaaS launch.</p>
          <div className="mt-6 grid gap-3">
            <Info label="Workspace" value="ARBCore AI" />
            <Info label="License status" value={subscription?.status || "Beta active"} />
            <Info label="Billing mode" value={subscription?.billingMode || "Manual beta"} />
            <Info label="Enforcement" value="Not active in beta" />
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
              <ShieldCheck className="h-5 w-5 text-royal" />
              <h2 className="text-lg font-black text-ink">Launch License Status</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal ring-1 ring-blue-100">Beta</span>
          </div>
          <div className="grid gap-3 p-5">
            <Info label="Current plan" value="Enterprise Beta" />
            <Info label="Subscription status" value={subscription?.status || "ACTIVE"} />
            <Info label="Billing mode" value={subscription?.billingMode || "MANUAL"} />
            <Info label="Workspace/company" value="ARBCore AI" />
            <Info label="Access mode" value="Single-company beta" />
            <Info label="Auth enforcement" value="Off unless AUTH_ENFORCED=true" />
            <Info label="Permission enforcement" value="Off unless PERMISSIONS_ENFORCED=true" />
            <Info label="Future mode" value="Multi-client SaaS with role-based access" />
            <Info label="Billing/license enforcement" value="Not active in this beta" />
            <p className="rounded-[16px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
              Manual payment tracking is available in Billing, but billing/license enforcement is not active yet. Gateway automation is not connected, card data must never be stored, and payment success must not be claimed until manual verification or future gateway confirmation.
            </p>
            <Link href="/billing" className={secondaryButtonClassName}>
              <CreditCard className="h-4 w-4" />
              Open Billing
            </Link>
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
