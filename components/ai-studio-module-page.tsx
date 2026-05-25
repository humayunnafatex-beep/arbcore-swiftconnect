"use client";

import { useMemo, useState } from "react";
import { Bot, Check, Copy, Languages, MessageSquareText, Save, Sparkles, Wand2 } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import { Toast, inputClassName, primaryButtonClassName, secondaryButtonClassName, textareaClassName, useToast } from "./saas-page-utils";

type AiGeneration = {
  generatedMessage?: string;
  suggestedTitle?: string;
  language?: string;
  tone?: string;
  output: string;
  usage?: {
    model?: string;
    provider?: string;
    usedFallback?: boolean;
  };
};

const tools = [
  { id: "campaign_message", title: "WhatsApp campaign message generator", icon: MessageSquareText },
  { id: "product_offer", title: "Product offer message", icon: Sparkles },
  { id: "follow_up", title: "Follow-up message", icon: Check },
  { id: "auto_reply", title: "Auto-reply suggestion", icon: Bot },
  { id: "bangla_english_rewrite", title: "Bangla-English/Banglish rewrite", icon: Languages },
  { id: "short_professional_rewrite", title: "Short professional message rewrite", icon: Wand2 }
];

export function AiStudioModulePage() {
  const { toast, showToast } = useToast();
  const [activeTool, setActiveTool] = useState(tools[0].id);
  const [form, setForm] = useState({
    businessName: "ARBCore SwiftConnect",
    product: "WhatsApp marketing automation",
    offer: "20% onboarding discount",
    tone: "professional",
    language: "English",
    audience: "small business owners",
    originalMessage: "We can help automate WhatsApp marketing and customer replies.",
    extra: "Keep it clear, friendly, and conversion focused."
  });
  const [output, setOutput] = useState("");
  const [meta, setMeta] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const activeTitle = tools.find((tool) => tool.id === activeTool)?.title ?? tools[0].title;
  const prompt = useMemo(() => {
    return [
      activeTitle,
      `Business: ${form.businessName}`,
      `Product/service: ${form.product}`,
      `Offer: ${form.offer}`,
      `Tone: ${form.tone}`,
      `Language: ${form.language}`,
      `Audience: ${form.audience}`,
      form.extra
    ].join(". ");
  }, [activeTitle, form]);

  async function generate() {
    setBusy(true);
    try {
      const result = await apiRequest<AiGeneration>("/api/ai/generate-message", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          generationType: activeTool,
          businessName: form.businessName,
          productOrService: form.product,
          offer: form.offer,
          tone: form.tone,
          language: form.language,
          targetAudience: form.audience,
          originalMessage: form.originalMessage,
          context: activeTitle
        })
      });
      setOutput(result.generatedMessage ?? result.output);
      setMeta(`${result.suggestedTitle ?? activeTitle} | ${result.language ?? form.language} | ${result.tone ?? form.tone} | ${result.usage?.provider ?? "mock"} ${result.usage?.usedFallback ? "fallback" : ""}`);
      showToast("AI message generated.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    showToast("Copied to clipboard.");
  }

  function saveTemplate() {
    if (!output) {
      showToast("Generate a message before saving a template.", "error");
      return;
    }
    setSavedTemplates((current) => [output, ...current].slice(0, 5));
    showToast("Saved as local template.");
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
            <Bot className="h-8 w-8" />
          </span>
          <div>
            <p className="text-xs font-black uppercase text-royal">AI Studio</p>
            <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">AI Content Workspace</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Generate WhatsApp-ready campaign, offer, follow-up, rewrite, and auto-reply copy using the local mock AI endpoint.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className={cn("flex w-full items-center gap-3 rounded-[18px] border p-4 text-left transition", activeTool === tool.id ? "border-royal bg-blue-50 shadow-sm" : "border-blue-100 bg-white/95 hover:bg-blue-50")}
                onClick={() => setActiveTool(tool.id)}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white text-royal ring-1 ring-blue-100">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-black text-ink">{tool.title}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_420px]">
          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
            <h2 className="text-lg font-black text-ink">{activeTitle}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Business name" value={form.businessName} onChange={(value) => setForm({ ...form, businessName: value })} />
              <Field label="Product/service" value={form.product} onChange={(value) => setForm({ ...form, product: value })} />
              <Field label="Offer" value={form.offer} onChange={(value) => setForm({ ...form, offer: value })} />
              <Field label="Target audience" value={form.audience} onChange={(value) => setForm({ ...form, audience: value })} />
              <label className="grid gap-1.5 text-xs font-black text-slate-500">
                Tone
                <select className={inputClassName} value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-black text-slate-500">
                Language
                <select className={inputClassName} value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}>
                  <option>English</option>
                  <option>Bangla</option>
                  <option>Banglish</option>
                </select>
              </label>
            </div>
            <label className="mt-3 grid gap-1.5 text-xs font-black text-slate-500">
              Original message
              <textarea className={textareaClassName} value={form.originalMessage} onChange={(event) => setForm({ ...form, originalMessage: event.target.value })} />
            </label>
            <label className="mt-3 grid gap-1.5 text-xs font-black text-slate-500">
              Extra instruction
              <textarea className={textareaClassName} value={form.extra} onChange={(event) => setForm({ ...form, extra: event.target.value })} />
            </label>
            <button className={`${primaryButtonClassName} mt-4`} onClick={() => void generate()} disabled={busy}>
              <Wand2 className="h-4 w-4" />
              {busy ? "Generating..." : "Generate Message"}
            </button>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
              <h2 className="text-lg font-black text-ink">Generated Output</h2>
              <div className="mt-4 min-h-72 rounded-[18px] border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-700">
                {output || "Your AI generated message preview will appear here."}
              </div>
              {meta ? <p className="mt-3 rounded-[14px] bg-white px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-blue-100">{meta}</p> : null}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button className={secondaryButtonClassName} onClick={() => void copyOutput()} disabled={!output}>
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                <button className={secondaryButtonClassName} onClick={saveTemplate} disabled={!output}>
                  <Save className="h-4 w-4" />
                  Save Template
                </button>
              </div>
            </section>

            <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
              <h2 className="text-base font-black text-ink">Saved Local Templates</h2>
              <div className="mt-3 space-y-2">
                {savedTemplates.length ? savedTemplates.map((template, index) => (
                  <p key={`${template}-${index}`} className="line-clamp-2 rounded-[16px] bg-blue-50 p-3 text-xs font-semibold text-slate-600">{template}</p>
                )) : <p className="rounded-[16px] bg-blue-50 p-3 text-xs font-semibold text-slate-500">No templates saved in this browser session.</p>}
              </div>
            </section>
          </aside>
        </div>
      </section>
      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-slate-500">
      {label}
      <input className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
