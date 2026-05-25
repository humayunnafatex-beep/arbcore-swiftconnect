"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarClock, Edit3, Eye, FileText, Megaphone, Plus, Rocket, Search, Send, Sparkles, Trash2 } from "lucide-react";
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

type CampaignStatus = "DRAFT" | "SCHEDULED" | "RUNNING" | "SENT" | "PAUSED" | "FAILED";
type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION" | "SUPPORT";
type TemplateLanguage = "ENGLISH" | "BANGLA" | "BANGLISH";
type TemplateStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

type Campaign = {
  id: string;
  name: string;
  templateName: string;
  templateVariables: Record<string, unknown> | null;
  targetSegment: string | null;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  _count?: { messageLogs: number };
};

type Contact = {
  id: string;
  name: string;
  phone: string;
  segment: string | null;
  optedIn: boolean;
};

type MessageLog = {
  id: string;
  campaignId: string | null;
  status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "RECEIVED";
  direction: "INBOUND" | "OUTBOUND";
};

type MessageTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  body: string;
  variables: string | null;
  footerText: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  status: TemplateStatus;
  updatedAt: string;
};

type CampaignForm = {
  name: string;
  targetSegment: string;
  templateId: string;
  offer: string;
  link: string;
  orderId: string;
  scheduledAt: string;
};

type TemplateForm = {
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  body: string;
  variables: string;
  footerText: string;
  buttonText: string;
  buttonUrl: string;
  status: TemplateStatus;
};

const fallbackTemplates: MessageTemplate[] = [
  {
    id: "fallback-promo",
    name: "Promo - Special Offer",
    category: "MARKETING",
    language: "ENGLISH",
    body: "Hi {{name}}, exclusive offer for you: {{offer}}. Shop now: {{link}}",
    variables: "{{name}},{{offer}},{{link}}",
    footerText: "ARBCore SwiftConnect",
    buttonText: "Shop Now",
    buttonUrl: "{{link}}",
    status: "APPROVED",
    updatedAt: new Date().toISOString()
  }
];

const emptyTemplateForm: TemplateForm = {
  name: "",
  category: "MARKETING",
  language: "ENGLISH",
  body: "Hi {{name}}, here is your offer: {{offer}}. Visit {{link}}",
  variables: "{{name}},{{offer}},{{link}}",
  footerText: "ARBCore SwiftConnect",
  buttonText: "Open Link",
  buttonUrl: "{{link}}",
  status: "DRAFT"
};

export function CampaignsModulePage() {
  const campaigns = useApiData<ListResponse<Campaign>>("/api/campaigns?pageSize=500");
  const contacts = useApiData<ListResponse<Contact>>("/api/contacts?pageSize=500");
  const messageLogs = useApiData<ListResponse<MessageLog>>("/api/messages/logs?pageSize=1000");
  const templates = useApiData<ListResponse<MessageTemplate>>("/api/templates?pageSize=500");
  const { toast, showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates">("campaigns");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplateForm);
  const [form, setForm] = useState<CampaignForm>({
    name: "",
    targetSegment: "",
    templateId: "",
    offer: "20% off this week",
    link: "https://arbcore.ai/offer",
    orderId: "ARB-1001",
    scheduledAt: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const allCampaigns = campaigns.data?.items ?? [];
  const allContacts = contacts.data?.items ?? [];
  const savedTemplates = templates.data?.items?.length ? templates.data.items : fallbackTemplates;

  const audienceOptions = useMemo(() => {
    return Array.from(new Set(allContacts.map((contact) => contact.segment).filter(Boolean) as string[])).sort();
  }, [allContacts]);

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allCampaigns.filter((campaign) => {
      const matchesSearch =
        !query ||
        campaign.name.toLowerCase().includes(query) ||
        campaign.templateName.toLowerCase().includes(query) ||
        (campaign.targetSegment ?? "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allCampaigns, search, statusFilter]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return savedTemplates.filter((template) => {
      const matchesSearch = !query || [template.name, template.category, template.language, template.status, template.body].join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || template.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [savedTemplates, search, statusFilter]);

  const logStats = useMemo(() => {
    const stats = new Map<string, { sent: number; delivered: number; read: number; replied: number; failed: number }>();
    (messageLogs.data?.items ?? []).forEach((log) => {
      if (!log.campaignId) return;
      const current = stats.get(log.campaignId) ?? { sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 };
      if (log.status === "SENT") current.sent += 1;
      if (log.status === "DELIVERED") current.delivered += 1;
      if (log.status === "READ") current.read += 1;
      if (log.status === "FAILED") current.failed += 1;
      if (log.direction === "INBOUND") current.replied += 1;
      stats.set(log.campaignId, current);
    });
    return stats;
  }, [messageLogs.data?.items]);

  const selectedTemplate = savedTemplates.find((template) => template.id === form.templateId) ?? savedTemplates[0];
  const preview = renderTemplate(selectedTemplate?.body ?? "", {
    name: allContacts[0]?.name ?? "Customer",
    offer: form.offer,
    link: form.link,
    order_id: form.orderId
  });

  function openTemplateModal(template?: MessageTemplate) {
    setEditingTemplate(template ?? null);
    setTemplateForm(
      template
        ? {
            name: template.name,
            category: template.category,
            language: template.language,
            body: template.body,
            variables: template.variables ?? "",
            footerText: template.footerText ?? "",
            buttonText: template.buttonText ?? "",
            buttonUrl: template.buttonUrl ?? "",
            status: template.status
          }
        : emptyTemplateForm
    );
    setTemplateModalOpen(true);
  }

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const duplicate = savedTemplates.find((template) => template.name.toLowerCase() === templateForm.name.toLowerCase() && template.id !== editingTemplate?.id);
    if (duplicate) {
      showToast("Duplicate template warning: this template name already exists.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...templateForm };
      if (editingTemplate) {
        await apiRequest<MessageTemplate>(`/api/templates/${editingTemplate.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Template updated.");
      } else {
        await apiRequest<MessageTemplate>("/api/templates", { method: "POST", body: JSON.stringify(payload) });
        showToast("Template created.");
      }
      templates.reload();
      setTemplateModalOpen(false);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTemplate(template: MessageTemplate) {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    setSubmitting(true);
    try {
      await apiRequest<{ deleted: boolean }>(`/api/templates/${template.id}`, { method: "DELETE" });
      showToast("Template deleted.");
      templates.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveCampaign("draft");
  }

  async function saveCampaign(mode: "draft" | "schedule" | "send") {
    setSubmitting(true);
    try {
      const campaign = await apiRequest<Campaign>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          templateName: selectedTemplate.name,
          targetSegment: form.targetSegment || null,
          scheduledAt: mode === "schedule" ? form.scheduledAt || null : null,
          templateVariables: {
            offer: form.offer,
            link: form.link,
            order_id: form.orderId,
            templateId: selectedTemplate.id
          }
        })
      });

      if (mode === "send") {
        const response = await apiRequest<{ sentCount: number }>(`/api/campaigns/${campaign.id}/send`, {
          method: "POST",
          body: JSON.stringify({ messageBody: preview })
        });
        showToast(`Campaign sent to ${response.sentCount} contact(s).`);
      } else {
        showToast(mode === "schedule" ? "Campaign scheduled." : "Campaign created.");
      }

      setComposerOpen(false);
      campaigns.reload();
      messageLogs.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendCampaign(campaign: Campaign) {
    const template = savedTemplates.find((item) => item.name === campaign.templateName);
    const body = renderTemplate(template?.body ?? `Template: ${campaign.templateName}`, {
      name: allContacts[0]?.name ?? "Customer",
      offer: readVariable(campaign.templateVariables, "offer", "Special offer"),
      link: readVariable(campaign.templateVariables, "link", "https://arbcore.ai"),
      order_id: readVariable(campaign.templateVariables, "order_id", "ARB-1001")
    });

    setSubmitting(true);
    try {
      const response = await apiRequest<{ sentCount: number }>(`/api/campaigns/${campaign.id}/send`, {
        method: "POST",
        body: JSON.stringify({ messageBody: body })
      });
      showToast(`Campaign sent to ${response.sentCount} contact(s).`);
      campaigns.reload();
      messageLogs.reload();
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
              <p className="text-xs font-black uppercase text-royal">Campaign Command</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Campaigns & Templates</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Compose campaigns and manage local WhatsApp message templates for this workspace.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className={secondaryButtonClassName} onClick={() => openTemplateModal()}>
              <FileText className="h-4 w-4" />
              New Template
            </button>
            <button className={primaryButtonClassName} onClick={() => setComposerOpen(true)}>
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Total campaigns" value={allCampaigns.length.toLocaleString()} helper="Workspace campaigns" />
        <Metric label="Templates" value={savedTemplates.length.toLocaleString()} helper="Local template library" />
        <Metric label="Approved" value={savedTemplates.filter((template) => template.status === "APPROVED").length.toLocaleString()} helper="Ready to use" />
        <Metric label="Audience contacts" value={allContacts.filter((contact) => contact.optedIn).length.toLocaleString()} helper="Opted-in records" />
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
        <div className="mb-4 flex flex-wrap gap-2">
          {["campaigns", "templates"].map((tab) => (
            <button
              key={tab}
              className={`h-10 rounded-[14px] px-4 text-sm font-black ${activeTab === tab ? "bg-royal text-white shadow-glow" : "border border-blue-100 bg-white text-royal"}`}
              onClick={() => setActiveTab(tab as "campaigns" | "templates")}
            >
              {tab === "campaigns" ? "Campaigns" : "Templates"}
            </button>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClassName} w-full pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search campaigns or templates" />
          </label>
          <select className={inputClassName} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {(activeTab === "campaigns" ? ["DRAFT", "SCHEDULED", "RUNNING", "SENT", "PAUSED", "FAILED"] : ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]).map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </select>
          <button className={secondaryButtonClassName} onClick={() => (activeTab === "campaigns" ? campaigns.reload() : templates.reload())}>
            <Sparkles className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {activeTab === "campaigns" ? (
        <CampaignTable campaigns={filteredCampaigns} loading={campaigns.loading || messageLogs.loading} error={campaigns.error ?? messageLogs.error} stats={logStats} onSend={sendCampaign} submitting={submitting} />
      ) : (
        <TemplateTable templates={filteredTemplates} loading={templates.loading} error={templates.error} onEdit={openTemplateModal} onDelete={deleteTemplate} />
      )}

      {composerOpen ? (
        <Modal title="Campaign Composer" onClose={() => setComposerOpen(false)}>
          <form className="grid gap-4" onSubmit={(event) => void createCampaign(event)}>
            <input className={inputClassName} required placeholder="Campaign name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={inputClassName} value={form.targetSegment} onChange={(event) => setForm({ ...form, targetSegment: event.target.value })}>
                <option value="">All opted-in contacts</option>
                {audienceOptions.map((audience) => <option key={audience} value={audience}>{audience}</option>)}
              </select>
              <select className={inputClassName} value={form.templateId || selectedTemplate.id} onChange={(event) => setForm({ ...form, templateId: event.target.value })}>
                {savedTemplates.map((template) => <option key={template.id} value={template.id}>{template.name} - {statusLabel(template.status)}</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className={inputClassName} placeholder="{{offer}}" value={form.offer} onChange={(event) => setForm({ ...form, offer: event.target.value })} />
              <input className={inputClassName} placeholder="{{link}}" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} />
              <input className={inputClassName} placeholder="{{order_id}}" value={form.orderId} onChange={(event) => setForm({ ...form, orderId: event.target.value })} />
            </div>
            <input className={inputClassName} type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} />
            <WhatsAppPreview body={preview} footer={selectedTemplate.footerText} buttonText={selectedTemplate.buttonText} buttonUrl={renderTemplate(selectedTemplate.buttonUrl ?? "", { name: "Customer", offer: form.offer, link: form.link, order_id: form.orderId })} />
            <div className="grid gap-2 sm:grid-cols-3">
              <button className={secondaryButtonClassName} disabled={submitting}><Plus className="h-4 w-4" />Save Draft</button>
              <button type="button" className={secondaryButtonClassName} onClick={() => void saveCampaign("schedule")} disabled={submitting || !form.name || !form.scheduledAt}><CalendarClock className="h-4 w-4" />Schedule</button>
              <button type="button" className={primaryButtonClassName} onClick={() => void saveCampaign("send")} disabled={submitting || !form.name}><Rocket className="h-4 w-4" />Send Now</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {templateModalOpen ? (
        <Modal title={editingTemplate ? "Edit Template" : "Create Template"} onClose={() => setTemplateModalOpen(false)}>
          <form className="grid gap-3" onSubmit={(event) => void saveTemplate(event)}>
            <input className={inputClassName} required placeholder="Template name" value={templateForm.name} onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-3">
              <select className={inputClassName} value={templateForm.category} onChange={(event) => setTemplateForm({ ...templateForm, category: event.target.value as TemplateCategory })}>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="AUTHENTICATION">Authentication</option>
                <option value="SUPPORT">Support</option>
              </select>
              <select className={inputClassName} value={templateForm.language} onChange={(event) => setTemplateForm({ ...templateForm, language: event.target.value as TemplateLanguage })}>
                <option value="ENGLISH">English</option>
                <option value="BANGLA">Bangla</option>
                <option value="BANGLISH">Banglish</option>
              </select>
              <select className={inputClassName} value={templateForm.status} onChange={(event) => setTemplateForm({ ...templateForm, status: event.target.value as TemplateStatus })}>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <textarea className={`${textareaClassName} min-h-32`} required placeholder="Body text" value={templateForm.body} onChange={(event) => setTemplateForm({ ...templateForm, body: event.target.value })} />
            <input className={inputClassName} placeholder="Variables: {{name}},{{offer}},{{link}},{{order_id}}" value={templateForm.variables} onChange={(event) => setTemplateForm({ ...templateForm, variables: event.target.value })} />
            <input className={inputClassName} placeholder="Footer text" value={templateForm.footerText} onChange={(event) => setTemplateForm({ ...templateForm, footerText: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClassName} placeholder="Button text" value={templateForm.buttonText} onChange={(event) => setTemplateForm({ ...templateForm, buttonText: event.target.value })} />
              <input className={inputClassName} placeholder="Button URL placeholder" value={templateForm.buttonUrl} onChange={(event) => setTemplateForm({ ...templateForm, buttonUrl: event.target.value })} />
            </div>
            <WhatsAppPreview body={renderTemplate(templateForm.body, { name: "Sadia", offer: "20% off", link: "https://arbcore.ai", order_id: "ARB-1001" })} footer={templateForm.footerText} buttonText={templateForm.buttonText} buttonUrl={templateForm.buttonUrl} />
            <button className={primaryButtonClassName} disabled={submitting}>{submitting ? "Saving..." : "Save Template"}</button>
          </form>
        </Modal>
      ) : null}

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function CampaignTable({ campaigns, loading, error, stats, onSend, submitting }: { campaigns: Campaign[]; loading: boolean; error: string | null; stats: Map<string, { sent: number; delivered: number; read: number; replied: number; failed: number }>; onSend: (campaign: Campaign) => Promise<void>; submitting: boolean }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
      <DataState loading={loading} error={error} empty={!campaigns.length} emptyText="No campaigns match this view.">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left">
            <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500"><tr>{["Campaign Name", "Template", "Audience", "Status", "Scheduled At", "Sent", "Delivered", "Read", "Replied", "Failed", "Actions"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-blue-50">
              {campaigns.map((campaign) => {
                const campaignStats = stats.get(campaign.id) ?? { sent: campaign._count?.messageLogs ?? 0, delivered: 0, read: 0, replied: 0, failed: 0 };
                return <tr key={campaign.id} className="text-sm font-semibold text-slate-600">
                  <td className="px-4 py-4 font-black text-ink">{campaign.name}</td><td className="px-4 py-4">{campaign.templateName}</td><td className="px-4 py-4">{campaign.targetSegment || "All opted-in contacts"}</td><td className="px-4 py-4"><Status status={campaign.status} /></td><td className="px-4 py-4">{formatDate(campaign.scheduledAt)}</td><td className="px-4 py-4">{campaignStats.sent}</td><td className="px-4 py-4">{campaignStats.delivered}</td><td className="px-4 py-4">{campaignStats.read}</td><td className="px-4 py-4">{campaignStats.replied}</td><td className="px-4 py-4">{campaignStats.failed}</td>
                  <td className="px-4 py-4"><button className={secondaryButtonClassName} onClick={() => void onSend(campaign)} disabled={submitting}><Send className="h-4 w-4" />Send</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  );
}

function TemplateTable({ templates, loading, error, onEdit, onDelete }: { templates: MessageTemplate[]; loading: boolean; error: string | null; onEdit: (template: MessageTemplate) => void; onDelete: (template: MessageTemplate) => Promise<void> }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
      <DataState loading={loading} error={error} empty={!templates.length} emptyText="No templates match this view.">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left">
            <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500"><tr>{["Template Name", "Category", "Language", "Status", "Variables", "Last Updated", "Actions"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-blue-50">
              {templates.map((template) => <tr key={template.id} className="text-sm font-semibold text-slate-600">
                <td className="px-4 py-4 font-black text-ink">{template.name}</td><td className="px-4 py-4">{statusLabel(template.category)}</td><td className="px-4 py-4">{statusLabel(template.language)}</td><td className="px-4 py-4"><Status status={template.status} /></td><td className="px-4 py-4">{template.variables || "-"}</td><td className="px-4 py-4">{formatDate(template.updatedAt)}</td>
                <td className="px-4 py-4"><div className="flex gap-2"><button className="grid h-9 w-9 place-items-center rounded-[12px] border border-blue-100 text-royal hover:bg-blue-50" onClick={() => onEdit(template)} aria-label="Edit template"><Edit3 className="h-4 w-4" /></button><button className="grid h-9 w-9 place-items-center rounded-[12px] border border-rose-100 text-rose-600 hover:bg-rose-50" onClick={() => void onDelete(template)} aria-label="Delete template"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  );
}

function WhatsAppPreview({ body, footer, buttonText, buttonUrl }: { body: string; footer?: string | null; buttonText?: string | null; buttonUrl?: string | null }) {
  return (
    <div className="rounded-[18px] border border-blue-100 bg-blue-50/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-royal"><Eye className="h-4 w-4" />WhatsApp Preview</div>
      <div className="max-w-md rounded-[18px] bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
        <p>{body || "Template body preview"}</p>
        {footer ? <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">{footer}</p> : null}
        {buttonText ? <div className="mt-3 rounded-[12px] border border-blue-100 bg-blue-50 px-3 py-2 text-center text-xs font-black text-royal">{buttonText}{buttonUrl ? ` - ${buttonUrl}` : ""}</div> : null}
      </div>
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <article className="rounded-[22px] border border-blue-100 bg-white/95 p-5 shadow-panel"><p className="text-xs font-black uppercase text-royal">{label}</p><p className="mt-3 text-3xl font-black text-ink">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p></article>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm"><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-blue-100 bg-white p-5 shadow-glow"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-black text-ink">{title}</h2><button className="rounded-[12px] border border-blue-100 px-3 py-2 text-sm font-black text-royal" onClick={onClose}>Close</button></div>{children}</section></div>;
}

function Status({ status }: { status: string }) {
  return <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal">{statusLabel(status)}</span>;
}

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{(name|offer|link|order_id)\}\}/g, (_match, key: string) => variables[key] ?? "");
}

function readVariable(variables: Record<string, unknown> | null, key: string, fallback: string) {
  const value = variables?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function statusLabel(status: string) {
  return status.toLowerCase().split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
