"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { primaryButtonClassName, secondaryButtonClassName } from "@/components/saas-page-utils";

type PermissionStatus = {
  authEnforced: boolean;
  permissionsEnforced: boolean;
  user: {
    exists: boolean;
    email: string | null;
    role: string | null;
  };
  permissions: string[];
};

type PermissionStatusEnvelope =
  | { success: true; data: PermissionStatus }
  | { success: false; error: { message?: string } | string };

const importantPermissions = [
  "dashboard.view",
  "contacts.view",
  "contacts.manage",
  "messages.send",
  "messages.viewLogs",
  "autoReply.view",
  "autoReply.manage",
  "settings.view",
  "settings.manage",
  "team.view",
  "team.manage",
  "license.view",
  "billing.manage",
  "orders.view",
  "orders.manage"
];

export default function AuthPermissionsPage() {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const readyForEnforcementTest = Boolean(status?.authEnforced && status.permissionsEnforced && status.user.exists && status.user.role);
  const missingImportantPermissions = status
    ? importantPermissions.filter((permission) => !status.permissions.includes(permission))
    : [];

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/permissions", { cache: "no-store" });
      const result = (await response.json()) as PermissionStatusEnvelope;

      if (!response.ok) {
        throw new Error("Unable to load permission status.");
      }

      if (!result.success) {
        const message = typeof result.error === "string" ? result.error : result.error?.message;
        throw new Error(message || "Unable to load permission status.");
      }

      setStatus(result.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load permission status.");
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
              <p className="text-xs font-black uppercase text-royal">Permission Readiness</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Auth Permissions</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Review the current user's role permissions without exposing sessions, cookies, or tokens.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={() => void loadStatus()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-5 rounded-[18px] border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
          Permission enforcement is off in beta unless PERMISSIONS_ENFORCED=true.
        </div>

        {!loading && !error && status ? (
          <div
            className={
              readyForEnforcementTest
                ? "mt-5 rounded-[18px] border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800"
                : "mt-5 rounded-[18px] border border-rose-100 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-700"
            }
          >
            {readyForEnforcementTest
              ? "Ready for permission enforcement test in local or staging."
              : status.permissionsEnforced
                ? "Permission enforcement is on, but a current user and role are required before testing."
                : "Permission enforcement is not active. This may be beta fallback mode or PERMISSIONS_ENFORCED=false."}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-5 rounded-[18px] bg-blue-50 p-5 text-sm font-bold text-royal">Loading permission status...</div>
        ) : error ? (
          <div className="mt-5 rounded-[18px] bg-rose-50 p-5 text-sm font-bold text-rose-700">{error}</div>
        ) : status ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[340px_1fr]">
            <section className="rounded-[22px] border border-blue-100 bg-white p-5">
              <h2 className="text-base font-black text-ink">Current Access</h2>
              <div className="mt-4 space-y-3">
                <Info label="Auth enforced" value={status.authEnforced ? "On" : "Off"} />
                <Info label="Permissions enforced" value={status.permissionsEnforced ? "On" : "Off"} />
                <Info label="User exists" value={status.user.exists ? "Yes" : "No"} />
                <Info label="Email" value={status.user.email || "-"} />
                <Info label="Role" value={status.user.role || "-"} />
              </div>
            </section>

            <section className="rounded-[22px] border border-blue-100 bg-white p-5">
              <h2 className="text-base font-black text-ink">Permission Matrix Summary</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Current role" value={status.user.role || "-"} />
                <Info label="Allowed count" value={String(status.permissions.length)} />
              </div>
              {status.permissions.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {status.permissions.map((permission) => (
                    <span key={permission} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-royal ring-1 ring-blue-100">
                      {permission}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-[16px] bg-blue-50 p-4 text-sm font-bold text-slate-500">No permissions are available for this role.</p>
              )}
              <div className="mt-5 rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">Missing important permissions</p>
                {missingImportantPermissions.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingImportantPermissions.map((permission) => (
                      <span key={permission} className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200">
                        {permission}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-bold text-emerald-700">No important permissions are missing for this role.</p>
                )}
              </div>
            </section>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={primaryButtonClassName} href="/auth/status">Auth Status</Link>
          <Link className={secondaryButtonClassName} href="/dashboard">Dashboard</Link>
          <Link className={secondaryButtonClassName} href="/settings">Settings</Link>
          <Link className={secondaryButtonClassName} href="/message-logs">Message Logs</Link>
          <Link className={secondaryButtonClassName} href="/login">Login</Link>
          <Link className={secondaryButtonClassName} href="/auth/logout">Logout</Link>
        </div>
      </section>
    </main>
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
