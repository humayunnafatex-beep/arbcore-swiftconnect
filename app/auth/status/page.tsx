"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { primaryButtonClassName, secondaryButtonClassName } from "@/components/saas-page-utils";

type AuthStatus = {
  authEnforced: boolean;
  supabaseUser: {
    exists: boolean;
    idPresent: boolean;
    email: string | null;
  };
  prismaUser: {
    exists: boolean;
    id: string | null;
    email: string | null;
    role: string | null;
    companyId: string | null;
    hasSupabaseAuthId: boolean;
  };
  company: {
    exists: boolean;
    id: string | null;
    name: string | null;
    slug: string | null;
    plan: string | null;
  };
  mode: "supabase_mapped" | "beta_fallback" | "unmapped" | "unauthenticated";
};

type AuthStatusEnvelope =
  | { success: true; data: AuthStatus }
  | { success: false; error: { message?: string } | string };

export default function AuthStatusPage() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const safeToTestEnforcement =
    status?.mode === "supabase_mapped" &&
    (status.prismaUser.role === "OWNER" || status.prismaUser.role === "ADMIN") &&
    status.company.exists;

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const result = (await response.json()) as AuthStatusEnvelope;

      if (!response.ok) {
        throw new Error("Unable to load auth status.");
      }

      if (!result.success) {
        const message = typeof result.error === "string" ? result.error : result.error?.message;
        throw new Error(message || "Unable to load auth status.");
      }

      setStatus(result.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load auth status.");
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
              <ShieldCheck className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Auth Verification</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Auth Status</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Verify Supabase Auth user to ARBCore user and company mapping without exposing sessions, cookies, or tokens.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={() => void loadStatus()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-5 rounded-[18px] border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
          Do not enable AUTH_ENFORCED=true in production until this page shows a mapped admin user.
        </div>

        {!loading && !error && status ? (
          <div
            className={
              safeToTestEnforcement
                ? "mt-5 rounded-[18px] border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800"
                : "mt-5 rounded-[18px] border border-rose-100 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-700"
            }
          >
            {safeToTestEnforcement
              ? "Safe to test AUTH_ENFORCED=true in local or staging. Keep production enforcement off until the full checklist passes."
              : "Do not enable auth enforcement yet. A mapped OWNER or ADMIN user with a company is required first."}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-5 rounded-[18px] bg-blue-50 p-5 text-sm font-bold text-royal">Loading auth status...</div>
        ) : error ? (
          <div className="mt-5 rounded-[18px] bg-rose-50 p-5 text-sm font-bold text-rose-700">{error}</div>
        ) : status ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <StatusCard title="Auth Mode">
              <Info label="Auth enforcement" value={status.authEnforced ? "On" : "Off"} />
              <Info label="Mode" value={status.mode} />
            </StatusCard>

            <StatusCard title="Supabase User">
              <Info label="Detected" value={status.supabaseUser.exists ? "Yes" : "No"} />
              <Info label="ID present" value={status.supabaseUser.idPresent ? "Yes" : "No"} />
              <Info label="Email" value={status.supabaseUser.email || "-"} />
            </StatusCard>

            <StatusCard title="Prisma User">
              <Info label="Mapped" value={status.prismaUser.exists ? "Yes" : "No"} />
              <Info label="Email" value={status.prismaUser.email || "-"} />
              <Info label="Role" value={status.prismaUser.role || "-"} />
              <Info label="Company ID" value={status.prismaUser.companyId || "-"} />
              <Info label="Has Supabase ID" value={status.prismaUser.hasSupabaseAuthId ? "Yes" : "No"} />
            </StatusCard>

            <StatusCard title="Company">
              <Info label="Exists" value={status.company.exists ? "Yes" : "No"} />
              <Info label="Name" value={status.company.name || "-"} />
              <Info label="Slug" value={status.company.slug || "-"} />
              <Info label="Plan" value={status.company.plan || "-"} />
            </StatusCard>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={primaryButtonClassName} href="/login">Login</Link>
          <Link className={secondaryButtonClassName} href="/auth/permissions">Permissions</Link>
          <Link className={secondaryButtonClassName} href="/auth/logout">Logout</Link>
          <Link className={secondaryButtonClassName} href="/dashboard">Dashboard</Link>
        </div>
      </section>
    </main>
  );
}

function StatusCard({ title, children }: { title: string; children: ReactNode }) {
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
