"use client";

import type React from "react";
import { FormEvent, useState } from "react";
import { Building2, CheckCircle2, LogOut, Plus, RefreshCw, ShieldAlert, Users } from "lucide-react";
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
  whatsappPhoneNumberIdPresent: boolean;
  messengerPageIdPresent: boolean;
  userCount: number;
  contactCount: number;
  messageCount: number;
};

type WorkspaceResponse = {
  items: Workspace[];
};

type CurrentWorkspaceResponse = {
  selectedWorkspace: {
    id: string;
    name: string;
    plan: string;
  } | null;
  defaultMode: boolean;
  warning: string;
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
  const currentWorkspace = useApiData<CurrentWorkspaceResponse>("/api/admin/workspaces/current");
  const { toast, showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const items = workspaces.data?.items ?? [];
  const selectedWorkspace = currentWorkspace.data?.selectedWorkspace ?? null;

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
      currentWorkspace.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function selectWorkspace(workspace: Workspace) {
    setSwitching(true);

    try {
      await apiRequest("/api/admin/workspaces/select", {
        method: "POST",
        body: JSON.stringify({ companyId: workspace.id })
      });
      currentWorkspace.reload();
      showToast(`${workspace.name} selected for beta admin testing. Open Dashboard, Settings, or Inbox to view this workspace context.`);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSwitching(false);
    }
  }

  async function clearSelectedWorkspace() {
    setSwitching(true);

    try {
      await apiRequest("/api/admin/workspaces/select", { method: "DELETE" });
      currentWorkspace.reload();
      showToast("Selected workspace cleared. Default beta workspace fallback is active.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSwitching(false);
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
          <p>Workspace creation and selection are beta/admin-only. Do not use workspace switching for untrusted clients until auth and company membership enforcement are complete.</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-blue-50 text-royal ring-1 ring-blue-100">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Current Workspace Context</p>
              <h2 className="mt-1 text-xl font-black text-ink">{selectedWorkspace ? selectedWorkspace.name : "Default beta fallback"}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                {selectedWorkspace
                  ? `${labelize(selectedWorkspace.plan)} selected by admin cookie. Open Dashboard, Settings, or Inbox to view this workspace context.`
                  : "No admin-selected workspace cookie is active."}
              </p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={() => void clearSelectedWorkspace()} disabled={switching || !selectedWorkspace}>
            <LogOut className="h-4 w-4" />
            Clear Selected Workspace
          </button>
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
          <DataState loading={workspaces.loading || currentWorkspace.loading} error={workspaces.error || currentWorkspace.error} empty={!items.length} emptyText="No workspaces found yet.">
            <div className="grid gap-4">
              {items.map((workspace) => (
                <article key={workspace.id} className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-ink">{workspace.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{workspace.slug}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedWorkspace?.id === workspace.id ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Selected</span>
                      ) : null}
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal ring-1 ring-blue-100">{labelize(workspace.plan)}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <Info label="Users" value={workspace.userCount.toLocaleString()} />
                    <Info label="Contacts" value={workspace.contactCount.toLocaleString()} />
                    <Info label="Messages" value={workspace.messageCount.toLocaleString()} />
                    <Info label="Created" value={formatDate(workspace.createdAt)} />
                    <Info label="WhatsApp ID" value={workspace.whatsappPhoneNumberIdPresent ? "Present" : "Missing"} />
                    <Info label="Messenger Page" value={workspace.messengerPageIdPresent ? "Present" : "Missing"} />
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold leading-5 text-slate-500">Selection uses a beta admin cookie only. Channel credentials stay separate per company.</p>
                    <button className={secondaryButtonClassName} onClick={() => void selectWorkspace(workspace)} disabled={switching || selectedWorkspace?.id === workspace.id}>
                      <CheckCircle2 className="h-4 w-4" />
                      {selectedWorkspace?.id === workspace.id ? "Selected" : "Select Workspace"}
                    </button>
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
