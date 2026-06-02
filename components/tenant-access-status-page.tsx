"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import { Building2, RefreshCw, ShieldCheck } from "lucide-react";
import { primaryButtonClassName, secondaryButtonClassName } from "@/components/saas-page-utils";

type TenantAccessStatus = {
  authEnforced: boolean;
  permissionsEnforced: boolean;
  tenantMembershipEnforced: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    companyId: string;
  } | null;
  selectedWorkspaceId: string | null;
  selectedWorkspacePresent: boolean;
  currentCompanyId: string | null;
  currentCompany: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  } | null;
  mode: "user_company" | "beta_selected_workspace" | "beta_default_fallback" | "unauthenticated";
  membershipValid: boolean;
  warnings: string[];
};

type TenantAccessEnvelope =
  | { success: true; data: TenantAccessStatus }
  | { success: false; error: { message?: string } | string };

export function TenantAccessStatusPage() {
  const [status, setStatus] = useState<TenantAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/tenant-access", { cache: "no-store" });
      const result = (await response.json()) as TenantAccessEnvelope;

      if (!response.ok) {
        throw new Error("Unable to load tenant access status.");
      }

      if (!result.success) {
        const message = typeof result.error === "string" ? result.error : result.error?.message;
        throw new Error(message || "Unable to load tenant access status.");
      }

      setStatus(result.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load tenant access status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto max-w-5xl rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <Building2 className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Tenant Readiness</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Tenant Access Status</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Review user-to-company access readiness without exposing sessions, cookies, or tokens.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={() => void loadStatus()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-5 rounded-[18px] border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
          Do not enable tenant membership enforcement in production until mapped admin and workspace access are verified.
        </div>

        {loading ? (
          <div className="mt-5 rounded-[18px] bg-blue-50 p-5 text-sm font-bold text-royal">Loading tenant access status...</div>
        ) : error ? (
          <div className="mt-5 rounded-[18px] bg-rose-50 p-5 text-sm font-bold text-rose-700">{error}</div>
        ) : status ? (
          <>
            <section className={`mt-5 rounded-[18px] border p-4 text-sm font-bold leading-6 ${status.membershipValid ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-100 bg-amber-50 text-amber-800"}`}>
              {status.membershipValid
                ? "Current user company matches the current company context."
                : "Membership is not valid for the current context, or no mapped user is available. This is report-only while enforcement is off."}
            </section>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <StatusCard title="Enforcement">
                <Info label="Auth enforced" value={status.authEnforced ? "On" : "Off"} />
                <Info label="Permissions enforced" value={status.permissionsEnforced ? "On" : "Off"} />
                <Info label="Tenant membership enforced" value={status.tenantMembershipEnforced ? "On" : "Off"} />
                <Info label="Mode" value={status.mode} />
                <Info label="Membership valid" value={status.membershipValid ? "Yes" : "No"} />
              </StatusCard>

              <StatusCard title="User">
                <Info label="Email" value={status.user?.email || "-"} />
                <Info label="Role" value={status.user?.role || "-"} />
                <Info label="User company" value={status.user?.companyId || "-"} />
              </StatusCard>

              <StatusCard title="Workspace Context">
                <Info label="Selected workspace" value={status.selectedWorkspacePresent ? "Present" : "Not present"} />
                <Info label="Selected workspace ID" value={status.selectedWorkspaceId || "-"} />
                <Info label="Current company ID" value={status.currentCompanyId || "-"} />
              </StatusCard>

              <StatusCard title="Current Company">
                <Info label="Name" value={status.currentCompany?.name || "-"} />
                <Info label="Slug" value={status.currentCompany?.slug || "-"} />
                <Info label="Plan" value={status.currentCompany?.plan || "-"} />
              </StatusCard>
            </div>

            <section className="mt-5 rounded-[22px] border border-blue-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-blue-50 text-royal ring-1 ring-blue-100">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h2 className="text-base font-black text-ink">Warnings</h2>
              </div>
              {status.warnings.length ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-bold leading-6 text-amber-800">
                  {status.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-[16px] bg-emerald-50 p-4 text-sm font-bold text-emerald-700">No tenant access warnings detected.</p>
              )}
            </section>
          </>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={primaryButtonClassName} href="/auth/status">Auth Status</Link>
          <Link className={secondaryButtonClassName} href="/auth/permissions">Permissions</Link>
          <Link className={secondaryButtonClassName} href="/admin/workspaces">Admin Workspaces</Link>
          <Link className={secondaryButtonClassName} href="/dashboard">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}

function StatusCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-blue-100 bg-white p-5">
      <h2 className="text-base font-black text-ink">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] bg-blue-50 px-4 py-3">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-black text-ink">{value}</span>
    </div>
  );
}
