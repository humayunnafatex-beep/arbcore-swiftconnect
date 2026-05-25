"use client";

import { Bot, Plus, Sparkles, Zap } from "lucide-react";
import { keywordRules } from "@/data/dashboard";
import { Panel, TinyLink } from "./panel";

export function AutoReplyAssistant() {
  return (
    <Panel title="Auto Reply + AI Assistant" action={<TinyLink>Manage Rules</TinyLink>} className="xl:col-span-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="rounded-[18px] border border-blue-100 bg-white">
          <div className="border-b border-blue-100 px-3 py-3 text-xs font-black text-slate-700">Keyword Rules</div>
          <div className="space-y-2 p-3">
            {keywordRules.map((rule, index) => (
              <div key={rule.keyword} className="flex items-start gap-3 rounded-[14px] bg-slate-50 p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-slate-500 ring-1 ring-blue-100">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-ink">{rule.keyword}</span>
                  <span className="block truncate text-[11px] font-medium text-slate-500">{rule.description}</span>
                </span>
              </div>
            ))}
          </div>
          <button className="mx-3 mb-3 flex h-10 w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-[12px] border border-blue-200 text-xs font-bold text-royal hover:bg-blue-50">
            <Plus className="h-4 w-4" />
            Add New Rule
          </button>
        </div>

        <div className="rounded-[18px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-4">
          <p className="flex items-center gap-2 text-xs font-black text-ink">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Reply Suggestion
          </p>
          <div className="mt-4 rounded-[16px] border border-blue-100 bg-white p-4">
            <p className="text-xs leading-6 text-slate-700">
              Hi {"{{name}}"}, thanks for your message! We are here to help. Our team will get back to you shortly.
            </p>
            <p className="mt-3 text-xs font-bold text-slate-600">- ARBCore Team</p>
          </div>
          <button className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[12px] bg-white text-xs font-bold text-royal ring-1 ring-blue-200 hover:bg-blue-50">
            <Zap className="h-4 w-4" />
            Use Reply
          </button>
        </div>
      </div>
    </Panel>
  );
}

export function AssistantChip() {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full bg-blue-50 px-3 text-xs font-black text-royal ring-1 ring-blue-100">
      <Bot className="h-4 w-4" />
      AI
    </span>
  );
}
