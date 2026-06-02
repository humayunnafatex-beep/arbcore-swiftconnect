"use client";

import type React from "react";
import { FormEvent, useState } from "react";
import { Building2, Plus, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import {
  DataState,
  Toast,
  formatDate,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  useApiData,
  useToast
} from "./saas-page-utils";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  userCount: number;
  contactCount: number;
  messageCount: number;
};

type WorkspaceResponse = {
  items: Workspace[];
};

const planOptions = ["ENTERPRISE_BETA", "STARTER_BETA", "GROWTH_BETA", "CUSTOM"];

const emptyForm = {
  name: "",
  slug: "",
  plan: "ENTERPRISE_BETA",
  ownerName: "",
  ownerEmail: ""
};

export function AdminWorkspacesModulePage() {
  const workspaces = useApiData<WorkspaceResponse>("/api/admin/workspaces");
  const { toast, showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const items = workspaces.data?.items ?? [];

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await apiRequest("/api/admin/workspaces", {
        method: "POST",
        body: JSON.stringify(form)
      });
      showToast("Workspace created. Configure channels separately after mapping is verified.");
      setForm(emptyForm);
      workspaces.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <Building2 className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Admin Workspaces</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Client Workspace Onboarding</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Create and review client workspace records for beta onboarding without changing the current active workspace session.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={() => workspaces.reload()} disabled={workspaces.loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[22px] border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Workspace creation is beta/admin-only. Auth enforcement and permission enforcement remain off by default, and new workspaces are not automatically selected for the current session.</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <article className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
          <div>
            <p className="text-xs font-black uppercase text-royal">Create Workspace</p>
            <h2 className="mt-1 text-xl font-black text-ink">Admin-assisted setup</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Channel credentials must be configured separately. Do not reuse another company&apos;s WhatsApp or Messenger tokens.</p>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={(event) => void createWorkspace(event)}>
            <Field label="Company name">
              <input className={inputClassName} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Client business name" />
            </Field>
            <Field label="Slug optional">
              <input className={inputClassName} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="client-business" />
            </Field>
            <Field label="Plan">
              <select className={inputClassName} value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })}>
                {planOptions.map((plan) => <option key={plan} value={plan}>{labelize(plan)}</option>)}
              </select>
            </Field>
            <Field label="Owner name optional">
              <input className={inputClassName} value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} placeholder="Client owner/admin name" />
            </Field>
            <Field label="Owner email optional">
              <input className={inputClassName} type="email" value={form.ownerEmail} onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })} placeholder="owner@example.com" />
            </Field>
            <button className={primaryButtonClassName} disabled={submitting}>
              <Plus className="h-4 w-4" />
              {submitting ? "Creating..." : "Create Workspace"}
            </button>
          </form>
        </article>

        <section className="space-y-4">
          <section className="grid gap-4 md:grid-cols-3">
            <Metric label="Workspaces" value={items.length.toLocaleString()} helper="Company records" />
            <Metric label="Users" value={items.reduce((total, item) => total + item.userCount, 0).toLocaleString()} helper="Mapped Prisma users" />
            <Metric label="Messages" value={items.reduce((total, item) => total + item.messageCount, 0).toLocaleString()} helper="Logged messages" />
          </section>
          <DataState loading={workspaces.loading} error={workspaces.error} empty={!items.length} emptyText="No workspaces found yet.">
            <div className="grid gap-4">
              {items.map((workspace) => (
                <article key={workspace.id} className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-ink">{workspace.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{workspace.slug}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal ring-1 ring-blue-100">{labelize(workspace.plan)}</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <Info label="Users" value={workspace.userCount.toLocaleString()} />
                    <Info label="Contacts" value={workspace.contactCount.toLocaleString()} />
                    <Info label="Messages" value={workspace.messageCount.toLocaleString()} />
                    <Info label="Created" value={formatDate(workspace.createdAt)} />
                  </div>
                </article>
              ))}
            </div>
          </DataState>
        </section>
      </section>

      <section className="rounded-[22px] border border-blue-100 bg-blue-50/70 p-4 text-sm font-bold leading-6 text-slate-600">
        <p>New workspace records do not copy channel credentials, do not switch the current session, and do not enable tenant enforcement. Verify Supabase user mapping before paid client onboarding.</p>
      </section>

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-[22px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <p className="text-xs font-black uppercase text-royal">{label}</p>
      <p className="mt-3 text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-blue-50 px-4 py-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function labelize(value: string) {
  return value.toLowerCase().split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
