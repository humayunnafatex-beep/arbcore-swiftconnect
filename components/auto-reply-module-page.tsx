"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Edit3, Lightbulb, Pause, Play, Plus, RefreshCw, Search, Trash2, Wand2, Zap } from "lucide-react";
import { apiRequest, getApiErrorMessage, type ListResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
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

type AutoReplyRule = {
  id: string;
  keyword: string;
  response: string;
  priority: number;
  isActive: boolean;
  matchMode: string;
  createdAt?: string;
  updatedAt?: string;
};

type RuleForm = {
  keyword: string;
  response: string;
  priority: string;
  matchMode: string;
  isActive: boolean;
};

type AiGeneration = {
  output: string;
};

type AutoReplyTemplate = {
  id: string;
  category: string;
  title: string;
  description: string;
  suggestedKeyword: string;
  suggestedMatchType: "CONTAINS" | "EXACT" | "STARTS_WITH";
  channelSuggestion: "WHATSAPP" | "MESSENGER" | "BOTH";
  replyText: string;
};

type AutoReplyTemplatesResponse = {
  categories: string[];
  templates: AutoReplyTemplate[];
};

type AutoReplyAnalytics = {
  filters: {
    channel: "ALL" | "WHATSAPP" | "MESSENGER";
    days: 7 | 30 | 90;
  };
  summary: {
    attempted: number;
    sent: number;
    failed: number;
    successRate: number;
  };
  byRule: Array<{
    ruleId: string | null;
    ruleName: string;
    channel: string;
    attempted: number;
    sent: number;
    failed: number;
    successRate: number;
    lastTriggeredAt: string | null;
  }>;
  recentEvents: Array<{
    id: string;
    ruleName: string;
    channel: string;
    customerKey: string;
    inboundTextPreview: string;
    replyPreview: string;
    status: string;
    errorMessage: string;
    createdAt: string;
  }>;
};

const categories = ["Price", "Order", "Delivery", "Payment", "Support", "STOP/Unsubscribe"];
const starterResponses: Record<string, string> = {
  Price: "Thanks for your interest. I can share the latest price list and current offers right away.",
  Order: "Thanks for your order message. Please share your order ID so we can check the latest status.",
  Delivery: "Delivery usually takes 2-4 working days depending on your location. Please share your area.",
  Payment: "You can complete payment through the available secure payment options. Send a screenshot after payment.",
  Support: "Our support team is here to help. Please describe the issue and we will follow up shortly.",
  "STOP/Unsubscribe": "You have been unsubscribed from promotional WhatsApp messages. Reply START anytime to opt in again."
};

const defaultForm: RuleForm = {
  keyword: "price",
  response: starterResponses.Price,
  priority: "10",
  matchMode: "CONTAINS",
  isActive: true
};

export function AutoReplyModulePage() {
  const rules = useApiData<ListResponse<AutoReplyRule>>("/api/auto-reply/rules?pageSize=100");
  const templates = useApiData<AutoReplyTemplatesResponse>("/api/auto-reply/templates");
  const { toast, showToast } = useToast();
  const [query, setQuery] = useState("");
  const [analyticsChannel, setAnalyticsChannel] = useState<AutoReplyAnalytics["filters"]["channel"]>("ALL");
  const [analyticsDays, setAnalyticsDays] = useState<AutoReplyAnalytics["filters"]["days"]>(30);
  const [templateCategory, setTemplateCategory] = useState("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [form, setForm] = useState<RuleForm>(defaultForm);
  const [aiPrompt, setAiPrompt] = useState("Write a polite WhatsApp reply for a customer asking about price.");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const analyticsPath = `/api/auto-reply/analytics?channel=${analyticsChannel}&days=${analyticsDays}`;
  const analytics = useApiData<AutoReplyAnalytics>(analyticsPath);

  const items = rules.data?.items ?? [];
  const filteredRules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((rule) => `${rule.keyword} ${rule.response} ${rule.matchMode}`.toLowerCase().includes(normalized));
  }, [items, query]);

  const filteredTemplates = useMemo(() => {
    const normalized = templateSearch.trim().toLowerCase();
    return (templates.data?.templates ?? []).filter((template) => {
      const matchesCategory = templateCategory === "all" || template.category === templateCategory;
      const matchesSearch =
        !normalized ||
        `${template.title} ${template.category} ${template.description} ${template.suggestedKeyword} ${template.replyText}`
          .toLowerCase()
          .includes(normalized);

      return matchesCategory && matchesSearch;
    });
  }, [templateCategory, templateSearch, templates.data?.templates]);

  function openCreate(category?: string) {
    const response = category ? starterResponses[category] : defaultForm.response;
    setEditingRule(null);
    setForm({
      keyword: category ? category.toLowerCase().replace("/unsubscribe", "") : defaultForm.keyword,
      response,
      priority: category === "STOP/Unsubscribe" ? "1" : "10",
      matchMode: category === "STOP/Unsubscribe" ? "EXACT" : "CONTAINS",
      isActive: true
    });
    setModalOpen(true);
  }

  function openEdit(rule: AutoReplyRule) {
    setEditingRule(rule);
    setForm({
      keyword: rule.keyword,
      response: rule.response,
      priority: String(rule.priority),
      matchMode: rule.matchMode,
      isActive: rule.isActive
    });
    setModalOpen(true);
  }

  function useTemplate(template: AutoReplyTemplate) {
    setEditingRule(null);
    setForm({
      keyword: template.suggestedKeyword,
      response: template.replyText,
      priority: "10",
      matchMode: template.suggestedMatchType,
      isActive: true
    });
    setModalOpen(true);
    showToast(`${template.title} loaded. Review before saving.`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = form.keyword.trim();
    const response = form.response.trim();
    const priority = Number(form.priority);

    if (!keyword) {
      showToast("Trigger keyword is required.", "error");
      return;
    }

    if (!response) {
      showToast("Reply message is required.", "error");
      return;
    }

    setBusy(true);
    try {
      const payload = { ...form, keyword, response, priority: Number.isFinite(priority) && priority > 0 ? priority : 100 };
      if (editingRule) {
        await apiRequest<AutoReplyRule>(`/api/auto-reply/rules/${editingRule.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Auto reply rule saved.");
      } else {
        await apiRequest<AutoReplyRule>("/api/auto-reply/rules", { method: "POST", body: JSON.stringify(payload) });
        showToast("Auto reply rule saved.");
      }
      setModalOpen(false);
      rules.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRule(rule: AutoReplyRule) {
    if (rule.isActive && !window.confirm(`Deactivate auto reply rule "${rule.keyword}"?`)) return;

    try {
      await apiRequest<AutoReplyRule>(`/api/auto-reply/rules/${rule.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !rule.isActive })
      });
      showToast(rule.isActive ? "Auto reply rule deactivated." : "Auto reply rule activated.");
      rules.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function deleteRule(rule: AutoReplyRule) {
    if (!window.confirm(`Delete auto reply rule "${rule.keyword}"?`)) return;
    try {
      await apiRequest<{ deleted: boolean }>(`/api/auto-reply/rules/${rule.id}`, { method: "DELETE" });
      showToast("Auto reply rule deleted.");
      rules.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function generateSuggestion() {
    setBusy(true);
    try {
      const result = await apiRequest<AiGeneration>("/api/ai/generate-message", {
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt, context: "auto reply rule", tone: "support" })
      });
      setAiSuggestion(result.output);
      showToast("AI suggestion generated.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <Bot className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Automation Studio</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Auto Reply Rules</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Manage keyword replies, rule status, and AI-assisted response drafts for this workspace.</p>
              <p className="mt-2 max-w-3xl text-xs font-bold leading-5 text-slate-500">Live auto replies are sent only when WhatsApp Cloud API is configured and an active rule matches an inbound message.</p>
            </div>
          </div>
          <button className={primaryButtonClassName} onClick={() => openCreate()}>
            <Plus className="h-4 w-4" />
            New Rule
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Active rules" value={items.filter((rule) => rule.isActive).length.toLocaleString()} helper="Currently responding" />
        <Metric label="Inactive rules" value={items.filter((rule) => !rule.isActive).length.toLocaleString()} helper="Paused automation" />
        <Metric label="Triggers 30d" value={(analytics.data?.summary.attempted ?? 0).toLocaleString()} helper="Real matched rule events" />
        <Metric label="Categories" value={categories.length.toLocaleString()} helper="Starter rule groups" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-royal">Template Library</p>
                <h2 className="mt-1 text-lg font-black text-ink">Ready-Made Auto Replies</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Templates are starting points. Review before saving. Text templates only; media auto-replies are not included in Phase 1.
                </p>
              </div>
              <button className={secondaryButtonClassName} onClick={templates.reload}>
                <RefreshCw className="h-4 w-4" />
                Refresh Templates
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
              <select className={inputClassName} value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)}>
                <option value="all">All categories</option>
                {(templates.data?.categories ?? []).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  className={`${inputClassName} w-full pl-9`}
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                  placeholder="Search templates by keyword, category, or reply text"
                />
              </label>
            </div>
            <DataState loading={templates.loading} error={templates.error} empty={!filteredTemplates.length} emptyText="No templates match this view.">
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {filteredTemplates.map((template) => (
                  <article key={template.id} className="rounded-[18px] border border-blue-100 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase text-royal ring-1 ring-blue-100">{template.category}</span>
                          <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black uppercase text-slate-600 ring-1 ring-slate-100">{template.channelSuggestion}</span>
                        </div>
                        <h3 className="mt-3 text-base font-black text-ink">{template.title}</h3>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{template.description}</p>
                      </div>
                      <button className={`${primaryButtonClassName} w-full sm:w-auto`} onClick={() => useTemplate(template)}>
                        Use Template
                      </button>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
                      <p><span className="text-royal">Keyword:</span> {template.suggestedKeyword}</p>
                      <p><span className="text-royal">Match:</span> {template.suggestedMatchType}</p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words rounded-[14px] bg-blue-50 p-3 text-sm font-semibold leading-6 text-slate-700">
                      {template.replyText}
                    </p>
                  </article>
                ))}
              </div>
            </DataState>
          </section>

          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-royal">Auto Reply Analytics</p>
                <h2 className="mt-1 text-lg font-black text-ink">Rule Performance</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Tracks matched auto-reply attempts and provider outcomes using safe message previews only.
                </p>
              </div>
              <button className={secondaryButtonClassName} onClick={analytics.reload}>
                <RefreshCw className="h-4 w-4" />
                Refresh Analytics
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select className={inputClassName} value={analyticsChannel} onChange={(event) => setAnalyticsChannel(event.target.value as AutoReplyAnalytics["filters"]["channel"])}>
                <option value="ALL">All channels</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="MESSENGER">Messenger</option>
              </select>
              <select className={inputClassName} value={analyticsDays} onChange={(event) => setAnalyticsDays(Number(event.target.value) as AutoReplyAnalytics["filters"]["days"])}>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            <DataState loading={analytics.loading} error={analytics.error} empty={!analytics.data} emptyText="Auto reply analytics are not available yet.">
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AnalyticsMetric label="Attempted" value={analytics.data?.summary.attempted ?? 0} helper="Matched rule sends" />
                <AnalyticsMetric label="Sent" value={analytics.data?.summary.sent ?? 0} helper="Provider accepted" tone="green" />
                <AnalyticsMetric label="Failed" value={analytics.data?.summary.failed ?? 0} helper="Needs review" tone="red" />
                <AnalyticsMetric label="Success Rate" value={`${analytics.data?.summary.successRate ?? 0}%`} helper="Sent / attempted" tone="blue" />
              </div>

              <div className="mt-5 overflow-hidden rounded-[18px] border border-blue-100">
                <div className="bg-blue-50/70 px-4 py-3">
                  <h3 className="text-sm font-black text-ink">Rule performance</h3>
                </div>
                {(analytics.data?.byRule.length ?? 0) ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-left">
                      <thead className="text-xs font-black uppercase text-slate-500">
                        <tr>
                          {["Rule", "Channel", "Attempted", "Sent", "Failed", "Success", "Last Triggered"].map((heading) => (
                            <th key={heading} className="px-4 py-3">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {(analytics.data?.byRule ?? []).map((rule) => (
                          <tr key={`${rule.ruleId ?? rule.ruleName}-${rule.channel}`} className="text-sm font-semibold text-slate-600">
                            <td className="px-4 py-3 font-black text-ink">{rule.ruleName}</td>
                            <td className="px-4 py-3">{rule.channel}</td>
                            <td className="px-4 py-3">{rule.attempted}</td>
                            <td className="px-4 py-3 text-emerald-700">{rule.sent}</td>
                            <td className="px-4 py-3 text-rose-700">{rule.failed}</td>
                            <td className="px-4 py-3">{rule.successRate}%</td>
                            <td className="px-4 py-3">{formatDate(rule.lastTriggeredAt ?? undefined)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-4 py-5 text-sm font-semibold text-slate-500">No matched auto replies in this filter yet.</p>
                )}
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-black text-ink">Recent events</h3>
                {(analytics.data?.recentEvents.length ?? 0) ? (
                  <div className="mt-3 grid gap-3">
                    {(analytics.data?.recentEvents ?? []).map((event) => (
                      <article key={event.id} className="rounded-[18px] border border-blue-100 bg-blue-50/55 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-royal ring-1 ring-blue-100">{event.channel}</span>
                              <StatusPill status={event.status} />
                            </div>
                            <h4 className="mt-2 text-sm font-black text-ink">{event.ruleName}</h4>
                            <p className="mt-1 break-words text-xs font-semibold text-slate-500">Customer: {event.customerKey || "Unknown"}</p>
                          </div>
                          <p className="text-xs font-bold text-slate-500">{formatDate(event.createdAt)}</p>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-600 lg:grid-cols-2">
                          <p className="break-words rounded-[14px] bg-white p-3 ring-1 ring-blue-100">Inbound: {event.inboundTextPreview || "-"}</p>
                          <p className="break-words rounded-[14px] bg-white p-3 ring-1 ring-blue-100">Reply: {event.replyPreview || "-"}</p>
                        </div>
                        {event.errorMessage ? (
                          <p className="mt-3 flex gap-2 break-words rounded-[14px] bg-rose-50 p-3 text-sm font-semibold leading-6 text-rose-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            {event.errorMessage}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-[18px] border border-blue-100 bg-blue-50/55 p-4 text-sm font-semibold text-slate-500">No recent auto reply events in this filter.</p>
                )}
              </div>
            </DataState>
          </section>

          <div className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input className={`${inputClassName} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rule, keyword, or reply" />
              </label>
              <button className={secondaryButtonClassName} onClick={rules.reload}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button key={category} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-royal hover:bg-blue-100" onClick={() => openCreate(category)}>
                  {category}
                </button>
              ))}
            </div>
          </div>

          <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
            <DataState loading={rules.loading} error={rules.error} empty={!filteredRules.length} emptyText="No rules match this view.">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left">
                  <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500">
                    <tr>
                      {["Rule Name", "Keywords", "Reply Message", "Status", "Priority", "Updated", "Actions"].map((heading) => (
                        <th key={heading} className="px-4 py-3">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {filteredRules.map((rule) => (
                      <tr key={rule.id} className="text-sm font-semibold text-slate-600">
                        <td className="px-4 py-4 font-black text-ink">{ruleName(rule.keyword)}</td>
                        <td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal">{rule.keyword}</span></td>
                        <td className="max-w-md px-4 py-4"><p className="line-clamp-2">{rule.response}</p></td>
                        <td className="px-4 py-4">
                          <button
                            className={cn("rounded-full px-3 py-1 text-xs font-black ring-1", rule.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-100 text-slate-600 ring-slate-200")}
                            onClick={() => void toggleRule(rule)}
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-4">{rule.priority}</td>
                        <td className="px-4 py-4">{formatDate(rule.updatedAt ?? rule.createdAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button className="grid h-9 w-9 place-items-center rounded-[12px] border border-blue-100 text-royal hover:bg-blue-50" onClick={() => openEdit(rule)} aria-label="Edit rule">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button className="grid h-9 w-9 place-items-center rounded-[12px] border border-blue-100 text-royal hover:bg-blue-50" onClick={() => void toggleRule(rule)} aria-label="Toggle rule">
                              {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                            <button className="grid h-9 w-9 place-items-center rounded-[12px] border border-rose-100 text-rose-600 hover:bg-rose-50" onClick={() => void deleteRule(rule)} aria-label="Delete rule">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataState>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-blue-50 text-royal"><Lightbulb className="h-5 w-5" /></span>
              <div>
                <h2 className="text-base font-black text-ink">AI Reply Suggestion</h2>
                <p className="text-xs font-semibold text-slate-500">Uses the local mock AI endpoint.</p>
              </div>
            </div>
            <textarea className={`${textareaClassName} mt-4 w-full`} value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} />
            <button className={`${secondaryButtonClassName} mt-3 w-full`} onClick={() => void generateSuggestion()} disabled={busy}>
              <Wand2 className="h-4 w-4" />
              Generate
            </button>
            <div className="mt-4 min-h-28 rounded-[18px] bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-700">
              {aiSuggestion || "AI-generated reply text will appear here."}
            </div>
          </section>
        </aside>
      </section>

      {modalOpen ? (
        <Modal title={editingRule ? "Edit Rule" : "Create Rule"} onClose={() => setModalOpen(false)}>
          <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
            <input className={inputClassName} required placeholder="Keyword" value={form.keyword} onChange={(event) => setForm({ ...form, keyword: event.target.value })} />
            <textarea className={`${textareaClassName} min-h-32`} required placeholder="Reply message" value={form.response} onChange={(event) => setForm({ ...form, response: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClassName} type="number" min="1" placeholder="Priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} />
              <select className={inputClassName} value={form.matchMode} onChange={(event) => setForm({ ...form, matchMode: event.target.value })}>
                <option value="CONTAINS">Contains</option>
                <option value="EXACT">Exact</option>
                <option value="STARTS_WITH">Starts with</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              Active rule
            </label>
            <button className={primaryButtonClassName} disabled={busy}>
              <Zap className="h-4 w-4" />
              {busy ? "Saving..." : "Save Rule"}
            </button>
          </form>
        </Modal>
      ) : null}

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
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

function AnalyticsMetric({ label, value, helper, tone = "gray" }: { label: string; value: string | number; helper: string; tone?: "blue" | "green" | "gray" | "red" }) {
  return (
    <article className={cn(
      "rounded-[18px] border p-4",
      tone === "green" && "border-emerald-100 bg-emerald-50",
      tone === "red" && "border-rose-100 bg-rose-50",
      tone === "blue" && "border-blue-100 bg-blue-50",
      tone === "gray" && "border-slate-100 bg-slate-50"
    )}>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-ink">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const isSent = status === "SENT";
  const isFailed = status === "FAILED";

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ring-1",
      isSent && "bg-emerald-50 text-emerald-700 ring-emerald-100",
      isFailed && "bg-rose-50 text-rose-700 ring-rose-100",
      !isSent && !isFailed && "bg-slate-50 text-slate-600 ring-slate-100"
    )}>
      {isSent ? <CheckCircle2 className="h-3.5 w-3.5" /> : isFailed ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
      {status}
    </span>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-[24px] border border-blue-100 bg-white p-5 shadow-glow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <button className="rounded-[12px] border border-blue-100 px-3 py-2 text-sm font-black text-royal" onClick={onClose}>Close</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ruleName(keyword: string) {
  return `${keyword.charAt(0).toUpperCase()}${keyword.slice(1)} Reply`;
}
