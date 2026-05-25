"use client";

import {
  BarChart3,
  Bot,
  CheckCircle2,
  ContactRound,
  KanbanSquare,
  Megaphone,
  MessageCircle,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { modulePages, type ModuleSlug } from "@/data/module-pages";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import { LiveApiSection } from "./live-api-section";
import { Panel } from "./panel";

const iconMap = {
  BarChart3,
  Bot,
  ContactRound,
  KanbanSquare,
  Megaphone,
  MessageCircle,
  Send,
  Settings,
  ShieldCheck,
  Zap
};

const toneClasses = {
  blue: "bg-blue-50 text-royal ring-blue-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100"
};

const gradientClasses = {
  blue: "from-royal to-electric",
  green: "from-emerald-500 to-cyan-500",
  violet: "from-violet-500 to-royal",
  amber: "from-amber-500 to-orange-500"
};

export function ModulePage({ slug }: { slug: ModuleSlug }) {
  const page = modulePages[slug];
  const Icon = iconMap[page.icon as keyof typeof iconMap] ?? Sparkles;

  return (
    <AppShell>
      <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white/92 shadow-panel backdrop-blur">
        <div className="relative p-5 sm:p-7">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[80px] bg-blue-50" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
                <Icon className="h-8 w-8" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-royal">{page.eyebrow}</p>
                <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">{page.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{page.description}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[330px]">
              <button className="h-12 rounded-[14px] border border-blue-200 bg-white px-4 text-sm font-bold text-royal transition hover:bg-blue-50">
                {page.secondaryAction}
              </button>
              <button className="h-12 rounded-[14px] bg-gradient-to-r from-royal to-electric px-4 text-sm font-bold text-white shadow-glow transition hover:brightness-105">
                {page.primaryAction}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {page.stats.map((stat) => (
          <article key={stat.label} className="min-h-[118px] rounded-[22px] border border-blue-100 bg-white/92 p-5 shadow-panel">
            <span className={cn("inline-flex h-8 items-center rounded-full px-3 text-xs font-black ring-1", toneClasses[stat.tone])}>
              {stat.label}
            </span>
            <p className="mt-4 text-3xl font-black text-ink">{stat.value}</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">{stat.helper}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel title={page.workflowTitle} className="xl:col-span-5">
          <div className="space-y-3">
            {page.workflow.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-[18px] border border-blue-50 bg-slate-50/70 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-black text-ink">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-black text-royal ring-1 ring-blue-100">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Live Workspace Cards" className="xl:col-span-4">
          <div className="grid gap-3">
            {page.cards.map((card) => (
              <article key={card.title} className="rounded-[18px] border border-blue-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className={cn("h-3 w-3 rounded-full bg-gradient-to-r", gradientClasses[card.tone])} />
                  <p className="truncate text-sm font-black text-ink">{card.title}</p>
                </div>
                <p className="mt-3 truncate text-2xl font-black text-ink">{card.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{card.detail}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Priority Focus" className="xl:col-span-3">
          <div className="rounded-[20px] bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-black text-ink">{page.primaryAction}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This workspace now reads and writes through the local ARBCore SwiftConnect API layer.
            </p>
          </div>
        </Panel>
      </div>

      <LiveApiSection slug={slug} />
    </AppShell>
  );
}
