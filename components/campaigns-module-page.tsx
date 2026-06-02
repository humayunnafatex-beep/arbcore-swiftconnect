"use client";

import type React from "react";
import { FormEvent, useMemo, useState } from "react";
import { Archive, Edit3, Megaphone, Plus, RefreshCw, Search, ShieldAlert, Users } from "lucide-react";
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
  audienceStatus: string;
  audienceTags: string;
  audienceSearch: string;
  audienceChannel: string;
  audienceLimit: number | null;
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
  audienceStatus: string;
  audienceTags: string;
  audienceSearch: string;
  audienceChannel: "" | CampaignChannel;
  audienceLimit: string;
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
  audienceStatus: "",
  audienceTags: "",
  audienceSearch: "",
  audienceChannel: "",
  audienceLimit: "",
  messageBody: "",
  templateName: "",
  scheduledAt: "",
  notes: ""
};

const statuses: CampaignStatus[] = ["DRAFT", "READY", "PAUSED", "ARCHIVED"];
const channels: CampaignChannel[] = ["WHATSAPP", "MESSENGER"];
const contactStatuses = ["", "NEW_LEAD", "INTERESTED", "FOLLOW_UP", "WON", "LOST"];

type AudiencePreview = {
  campaign: {
    id: string;
    name: string;
  };
  audience: {
    estimatedCount: number;
    previewLimit: number;
    warning: string;
    preview: Array<{
      id: string;
      name: string;
      phone: string;
      email: string | null;
      status: string;
      tags: string | null;
    }>;
  };
};

function dateInputValue(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

function campaignToForm(campaign: Campaign): CampaignForm {
  return {
    id: campaign.id,
    name: campaign.name,
    channel: campaign.channel,
    status: campaign.status,
    audienceNote: campaign.audienceNote || "",
    audienceStatus: campaign.audienceStatus || "",
    audienceTags: campaign.audienceTags || "",
    audienceSearch: campaign.audienceSearch || "",
    audienceChannel: (campaign.audienceChannel || "") as "" | CampaignChannel,
    audienceLimit: campaign.audienceLimit ? String(campaign.audienceLimit) : "",
    messageBody: campaign.messageBody || "",
    templateName: campaign.templateName || "",
    scheduledAt: dateInputValue(campaign.scheduledAt),
    notes: campaign.notes || ""
  };
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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState<AudiencePreview | null>(null);

  const items = campaigns.data?.items ?? [];
  const draftCount = useMemo(() => items.filter((item) => item.status === "DRAFT").length, [items]);
  const readyCount = useMemo(() => items.filter((item) => item.status === "READY").length, [items]);

  function resetForm() {
    setForm(emptyForm);
  }

  function editCampaign(campaign: Campaign) {
    setForm(campaignToForm(campaign));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function previewAudience(campaign?: Campaign) {
    const target = campaign ?? items.find((item) => item.id === form.id);
    if (!target?.id) {
      showToast("Save the campaign draft before previewing audience.", "error");
      return;
    }

    setPreviewLoading(true);
    try {
      const params = new URLSearchParams({
        status: form.id === target.id ? form.audienceStatus : target.audienceStatus || "",
        tags: form.id === target.id ? form.audienceTags : target.audienceTags || "",
        search: form.id === target.id ? form.audienceSearch : target.audienceSearch || "",
        channel: form.id === target.id ? form.audienceChannel : target.audienceChannel || "",
        limit: form.id === target.id ? form.audienceLimit : target.audienceLimit ? String(target.audienceLimit) : ""
      });
      const result = await apiRequest<AudiencePreview>(`/api/campaigns/${target.id}/audience?${params.toString()}`);
      setAudiencePreview(result);
      showToast("Audience preview loaded.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        scheduledAt: form.scheduledAt || null,
        audienceLimit: form.audienceLimit ? Number(form.audienceLimit) : null
      };

      const saved = form.id
        ? await apiRequest<Campaign>(`/api/campaigns/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        })
        : await apiRequest<Campaign>("/api/campaigns", {
          method: "POST",
          body: JSON.stringify(payload)
        });

      setForm(campaignToForm(saved));
      setAudiencePreview(null);
      showToast(form.id ? "Campaign draft updated. Audience preview is available." : "Campaign draft created. Audience preview is available.");
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
            <section className="rounded-[18px] border border-blue-100 bg-blue-50/55 p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-royal" />
                <p className="text-xs font-black uppercase text-royal">Audience Criteria</p>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">Save the draft first, then preview the matching contacts. Preview does not send messages.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Contact status">
                  <select className={inputClassName} value={form.audienceStatus} onChange={(event) => setForm({ ...form, audienceStatus: event.target.value })}>
                    {contactStatuses.map((status) => <option key={status || "ALL"} value={status}>{status ? statusLabel(status) : "All statuses"}</option>)}
                  </select>
                </Field>
                <Field label="Audience channel">
                  <select className={inputClassName} value={form.audienceChannel} onChange={(event) => setForm({ ...form, audienceChannel: event.target.value as "" | CampaignChannel })}>
                    <option value="">All channels</option>
                    {channels.map((channel) => <option key={channel} value={channel}>{statusLabel(channel)}</option>)}
                  </select>
                </Field>
                <Field label="Tags filter">
                  <input className={inputClassName} value={form.audienceTags} onChange={(event) => setForm({ ...form, audienceTags: event.target.value })} placeholder="vip, repeat buyer" />
                </Field>
                <Field label="Search filter">
                  <input className={inputClassName} value={form.audienceSearch} onChange={(event) => setForm({ ...form, audienceSearch: event.target.value })} placeholder="name, phone, email, tag, segment" />
                </Field>
                <Field label="Audience limit">
                  <input className={inputClassName} type="number" min="1" max="10000" value={form.audienceLimit} onChange={(event) => setForm({ ...form, audienceLimit: event.target.value })} placeholder="Optional limit" />
                </Field>
                <div className="flex items-end">
                  <button type="button" className={secondaryButtonClassName} onClick={() => void previewAudience()} disabled={previewLoading || !form.id}>
                    <Users className="h-4 w-4" />
                    {previewLoading ? "Previewing..." : "Preview Audience"}
                  </button>
                </div>
              </div>
            </section>
            {audiencePreview ? <AudiencePreviewPanel preview={audiencePreview} /> : null}
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
              <Info label="Audience tags" value={campaign.audienceTags || "-"} />
              <Info label="Audience status" value={campaign.audienceStatus ? statusLabel(campaign.audienceStatus) : "All"} />
              <Info label="Audience channel" value={campaign.audienceChannel ? statusLabel(campaign.audienceChannel) : "All"} />
              <Info label="Audience search" value={campaign.audienceSearch || "-"} />
              <Info label="Audience limit" value={campaign.audienceLimit ? campaign.audienceLimit.toLocaleString() : "-"} />
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

function AudiencePreviewPanel({ preview }: { preview: AudiencePreview }) {
  return (
    <section className="rounded-[18px] border border-amber-100 bg-amber-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-amber-700">Audience Preview</p>
          <p className="mt-1 text-sm font-bold text-amber-800">{preview.audience.warning}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
          {preview.audience.estimatedCount.toLocaleString()} estimated
        </span>
      </div>
      <div className="mt-4 max-h-72 overflow-y-auto rounded-[16px] bg-white">
        {preview.audience.preview.length ? (
          <div className="divide-y divide-amber-100">
            {preview.audience.preview.map((contact) => (
              <div key={contact.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[1fr_140px]">
                <div>
                  <p className="font-black text-ink">{contact.name}</p>
                  <p className="text-xs font-semibold text-slate-500">{contact.email || "No email"} - {statusLabel(contact.status)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-bold text-slate-700">{contact.phone}</p>
                  <p className="text-xs font-semibold text-slate-500">{contact.tags || "No tags"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 text-sm font-semibold text-slate-500">No contacts match this audience preview.</p>
        )}
      </div>
      <p className="mt-3 text-xs font-bold text-amber-800">Showing up to {preview.audience.previewLimit} contacts. Preview only. No messages will be sent.</p>
    </section>
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
