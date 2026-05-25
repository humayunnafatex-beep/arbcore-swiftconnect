"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { numberHealthSeries } from "@/data/dashboard";
import { Panel, TinyLink } from "./panel";

export function NumberHealth() {
  return (
    <Panel title="Number Health" action={<TinyLink>View Details</TinyLink>} className="xl:col-span-2">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full bg-[conic-gradient(#16a34a_0_82%,#e5eefc_82%_100%)]">
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white">
              <span className="text-2xl font-black text-ink">92</span>
              <span className="-mt-2 text-[10px] font-bold text-slate-400">/100</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-emerald-600">Excellent</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Your number quality looks great.</p>
          </div>
        </div>
        <div className="h-[148px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...numberHealthSeries]} margin={{ top: 8, right: 4, left: -26, bottom: 0 }}>
              <defs>
                <linearGradient id="healthFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1957ff" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#1957ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  boxShadow: "0 12px 30px rgba(30, 85, 190, 0.12)"
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#1957ff"
                strokeWidth={3}
                fill="url(#healthFill)"
                dot={{ r: 3, fill: "#1957ff", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  );
}
