"use client";

import type React from "react";
import { FormEvent, useMemo, useState } from "react";
import { Archive, CalendarClock, Edit3, Megaphone, Plus, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { apiRequest, getApiErrorMessage, type ListResponse } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import {
  DataState,
  Toast,
  formatDate,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  textareaClassName,
  useApiData,
  useToast
} from "./saas-page-utils";

type CampaignStatus = "DRAFT" | "READY" | "PAUSED" | "ARCHIVED";
type CampaignChannel = "WHATSAPP" | "MESSENGER";

type Campaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  audienceNote: string;
  messageBody: string;
  templateName: string;
  scheduledAt: string | null;
  notes: string;
  updatedAt: string;
};

type CampaignForm = {
  id: string | null;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  audienceNote: string;
  messageBody: string;
  templateName: string;
  scheduledAt: string;
  notes: string;
};

const emptyForm: CampaignForm = {
  id: null,
  name: "",
  channel: "WHATSAPP",
  status: "DRAFT",
  audienceNote: "",
  messageBody: "",
  templateName: "",
  scheduledAt: "",
  notes: ""
};

const statuses: CampaignStatus[] = ["DRAFT", "READY", "PAUSED", "ARCHIVED"];
const channels: CampaignChannel[] = ["WHATSAPP", "MESSENGER"];

function dateInputValue(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

export function CampaignsModulePage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const campaignsPath = `/api/campaigns?pageSize=100&status=${encodeURIComponent(statusFilter)}&channel=${encodeURIComponent(channelFilter)}&search=${encodeURIComponent(search)}`;
  const campaigns = useApiData<ListResponse<Campaign>>(campaignsPath);
  const { toast, showToast } = useToast();
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const items = campaigns.data?.items ?? [];
  const draftCount = useMemo(() => items.filter((item) => item.status === "DRAFT").length, [items]);
  const readyCount = useMemo(() => items.filter((item) => item.status === "READY").length, [items]);

  function resetForm() {
    setForm(emptyForm);
  }

  function editCampaign(campaign: Campaign) {
    setForm({
      id: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      audienceNote: campaign.audienceNote || "",
      messageBody: campaign.messageBody || "",
      templateName: campaign.templateName || "",
      scheduledAt: dateInputValue(campaign.scheduledAt),
      notes: campaign.notes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        scheduledAt: form.scheduledAt || null
      };

      if (form.id) {
        await apiRequest<Campaign>(`/api/campaigns/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        showToast("Campaign draft updated.");
      } else {
        await apiRequest<Campaign>("/api/campaigns", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast("Campaign draft created.");
      }

      resetForm();
      campaigns.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function archiveCampaign(campaign: Campaign) {
    if (!window.confirm(`Archive campaign "${campaign.name}"?`)) return;
    setSubmitting(true);

    try {
      await apiRequest<{ archived: boolean }>(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      showToast("Campaign archived.");
      campaigns.reload();
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
              <Megaphone className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Campaign Drafts</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Campaign Planning</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Plan WhatsApp and Messenger campaign drafts safely. Bulk sending is not active in this phase.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={() => campaigns.reload()} disabled={campaigns.loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[22px] border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Campaigns are drafts only in this phase. No bulk messages are sent, no broadcast automation runs, and no sent or delivered metrics are faked.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Visible campaigns" value={items.length.toLocaleString()} helper="Filtered draft records" />
        <Metric label="Drafts" value={draftCount.toLocaleString()} helper="Planning stage" />
        <Metric label="Ready" value={readyCount.toLocaleString()} helper="Reviewed, not sent" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <article className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-royal">Campaign Draft Form</p>
              <h2 className="mt-1 text-xl font-black text-ink">{form.id ? "Edit draft" : "Create draft"}</h2>
            </div>
            {form.id ? <button className={secondaryButtonClassName} onClick={resetForm}>New</button> : null}
          </div>

          <form className="mt-5 grid gap-4" onSubmit={(event) => void saveDraft(event)}>
            <Field label="Campaign name">
              <input className={inputClassName} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Eid offer follow-up" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Channel">
                <select className={inputClassName} value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as CampaignChannel })}>
                  {channels.map((channel) => <option key={channel} value={channel}>{statusLabel(channel)}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClassName} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CampaignStatus })}>
                  {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Audience note">
              <input className={inputClassName} value={form.audienceNote} onChange={(event) => setForm({ ...form, audienceNote: event.target.value })} placeholder="Opted-in customers, VIP list, or manual segment note" />
            </Field>
            <Field label="Message body">
              <textarea className={`${textareaClassName} min-h-36`} required value={form.messageBody} onChange={(event) => setForm({ ...form, messageBody: event.target.value })} placeholder="Write the campaign message draft. This will not be sent in this phase." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Template name optional">
                <input className={inputClassName} value={form.templateName} onChange={(event) => setForm({ ...form, templateName: event.target.value })} placeholder="Future approved template name" />
              </Field>
              <Field label="Scheduled date optional">
                <input className={inputClassName} type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea className={textareaClassName} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Internal planning notes, approvals, or policy reminders." />
            </Field>
            <button className={primaryButtonClassName} disabled={submitting}>
              <Plus className="h-4 w-4" />
              {submitting ? "Saving..." : "Save Draft"}
            </button>
          </form>
        </article>

        <section className="space-y-4">
          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input className={`${inputClassName} w-full pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, audience, message, or template" />
              </label>
              <select className={inputClassName} value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
                <option value="ALL">All channels</option>
                {channels.map((channel) => <option key={channel} value={channel}>{statusLabel(channel)}</option>)}
              </select>
              <select className={inputClassName} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">All statuses</option>
                {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </div>
          </section>

          <CampaignList campaigns={items} loading={campaigns.loading} error={campaigns.error} onEdit={editCampaign} onArchive={archiveCampaign} submitting={submitting} />
        </section>
      </section>

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function CampaignList({ campaigns, loading, error, onEdit, onArchive, submitting }: { campaigns: Campaign[]; loading: boolean; error: string | null; onEdit: (campaign: Campaign) => void; onArchive: (campaign: Campaign) => Promise<void>; submitting: boolean }) {
  return (
    <DataState loading={loading} error={error} empty={!campaigns.length} emptyText="No campaign drafts match this view.">
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-ink">{campaign.name}</h3>
                  <Status value={campaign.channel} />
                  <Status value={campaign.status} />
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{campaign.audienceNote || "No audience note yet."}</p>
              </div>
              <div className="flex gap-2">
                <button className="grid h-10 w-10 place-items-center rounded-[12px] border border-blue-100 text-royal hover:bg-blue-50" onClick={() => onEdit(campaign)} aria-label="Edit campaign">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-[12px] border border-amber-100 text-amber-700 hover:bg-amber-50" onClick={() => void onArchive(campaign)} disabled={submitting} aria-label="Archive campaign">
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-[18px] bg-blue-50/70 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Message preview</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{preview(campaign.messageBody)}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info label="Template" value={campaign.templateName || "-"} />
              <Info label="Scheduled" value={formatDate(campaign.scheduledAt)} />
              <Info label="Updated" value={formatDate(campaign.updatedAt)} />
            </div>
            {campaign.notes ? <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">{campaign.notes}</p> : null}
          </article>
        ))}
      </div>
    </DataState>
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

function Status({ value }: { value: string }) {
  return <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal ring-1 ring-blue-100">{statusLabel(value)}</span>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-blue-50 px-4 py-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function preview(value: string) {
  return value.length > 220 ? `${value.slice(0, 220)}...` : value;
}

function statusLabel(status: string) {
  return status.toLowerCase().split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
