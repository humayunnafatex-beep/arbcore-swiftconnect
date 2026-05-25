"use client";

import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { crmStages } from "@/data/dashboard";
import { cn } from "@/lib/utils";
import { Panel } from "./panel";

const stageColor = {
  blue: "bg-blue-50 text-royal",
  cyan: "bg-cyan-50 text-cyan-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700"
};

export function CrmPipeline() {
  return (
    <Panel
      title="Contact Funnel / CRM Pipeline"
      action={
        <button className="flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-slate-600 hover:bg-blue-50">
          This Month <ChevronDown className="h-3.5 w-3.5" />
        </button>
      }
      className="xl:col-span-4"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {crmStages.map((stage) => {
          const IsUp = stage.state === "up";
          const TrendIcon = IsUp ? ArrowUp : ArrowDown;
          return (
            <article
              key={stage.label}
              className="min-h-[150px] rounded-[18px] border border-blue-100 bg-gradient-to-b from-white to-blue-50/35 p-3"
            >
              <span
                className={cn(
                  "inline-flex h-8 items-center rounded-full px-3 text-[11px] font-black",
                  stageColor[stage.color]
                )}
              >
                {stage.label}
              </span>
              <p className="mt-6 text-2xl font-black text-ink">{stage.value}</p>
              <p
                className={cn(
                  "mt-5 inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-black",
                  IsUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                {stage.change}
              </p>
              <p className="mt-1 truncate text-[11px] font-medium text-slate-500">vs last month</p>
            </article>
          );
        })}
      </div>
      <button className="mt-4 h-10 w-full rounded-[14px] text-sm font-bold text-royal transition hover:bg-blue-50">
        View Full Pipeline
      </button>
    </Panel>
  );
}
