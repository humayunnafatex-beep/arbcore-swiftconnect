"use client";

import { CalendarClock, CheckCheck, ChevronDown, FileText, Gift, Sparkles } from "lucide-react";
import { Panel } from "./panel";

export function CampaignComposer() {
  return (
    <Panel
      title="Campaign Composer"
      action={<button className="h-8 rounded-full px-3 text-xs font-semibold text-royal hover:bg-blue-50">Draft Only</button>}
      className="xl:col-span-5"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold text-slate-500">Template</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="flex h-12 min-w-0 flex-1 items-center justify-between rounded-[14px] border border-blue-100 bg-white px-4 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200">
              <span className="truncate">Promo - Special Offer</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            </button>
            <button className="flex h-12 items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-white px-5 text-sm font-bold text-royal transition hover:bg-blue-50">
              <Sparkles className="h-4 w-4" />
              Personalize
            </button>
          </div>
        </div>

        <div className="rounded-[18px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4">
          <p className="text-sm leading-7 text-slate-800">
            Hi {"{{1}}"}, <Gift className="inline h-4 w-4 text-amber-500" />
            <br />
            Exclusive offer just for you! Get 20% off on your next purchase. Valid till {"{{2}}"}.
            <br />
            <br />
            Shop now: {"{{3}}"}
          </p>
          <div className="mt-2 flex items-center justify-end gap-2 text-sm font-semibold text-slate-500">
            10:30 AM
            <CheckCheck className="h-4 w-4 text-emerald-600" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button className="flex h-12 items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-white text-sm font-bold text-royal transition hover:bg-blue-50">
            <CalendarClock className="h-4 w-4" />
            Plan Date
          </button>
          <button className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-royal to-electric text-sm font-bold text-white shadow-glow transition hover:brightness-105">
            <FileText className="h-4 w-4" />
            Save Draft
          </button>
        </div>
      </div>
    </Panel>
  );
}
