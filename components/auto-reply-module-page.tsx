"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Edit3, Lightbulb, Pause, Play, Plus, RefreshCw, Search, Trash2, Wand2, Zap } from "lucide-react";
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
  const { toast, showToast } = useToast();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [form, setForm] = useState<RuleForm>(defaultForm);
  const [aiPrompt, setAiPrompt] = useState("Write a polite WhatsApp reply for a customer asking about price.");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [busy, setBusy] = useState(false);

  const items = rules.data?.items ?? [];
  const filteredRules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((rule) => `${rule.keyword} ${rule.response} ${rule.matchMode}`.toLowerCase().includes(normalized));
  }, [items, query]);

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, priority: Number(form.priority) };
      if (editingRule) {
        await apiRequest<AutoReplyRule>(`/api/auto-reply/rules/${editingRule.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("Rule updated.");
      } else {
        await apiRequest<AutoReplyRule>("/api/auto-reply/rules", { method: "POST", body: JSON.stringify(payload) });
        showToast("Rule created.");
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
    try {
      await apiRequest<AutoReplyRule>(`/api/auto-reply/rules/${rule.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !rule.isActive })
      });
      showToast(rule.isActive ? "Rule paused." : "Rule activated.");
      rules.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function deleteRule(rule: AutoReplyRule) {
    if (!window.confirm(`Delete auto reply rule "${rule.keyword}"?`)) return;
    try {
      await apiRequest<{ deleted: boolean }>(`/api/auto-reply/rules/${rule.id}`, { method: "DELETE" });
      showToast("Rule deleted.");
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
        <Metric label="Trigger count" value={items.reduce((sum, rule) => sum + syntheticTriggers(rule), 0).toLocaleString()} helper="Mock local metric" />
        <Metric label="Categories" value={categories.length.toLocaleString()} helper="Starter rule groups" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
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
                      {["Rule Name", "Keywords", "Reply Message", "Status", "Trigger Count", "Last Triggered", "Actions"].map((heading) => (
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
                        <td className="px-4 py-4">{syntheticTriggers(rule)}</td>
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

function syntheticTriggers(rule: AutoReplyRule) {
  return Math.max(1, (rule.priority * 7 + rule.keyword.length * 11) % 180);
}
