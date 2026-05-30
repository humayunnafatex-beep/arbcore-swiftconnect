"use client";

import { StatusPill } from "./status-pill";

const usage = [
  { label: "Messages Used", value: "28,420 / 100,000", percent: 28 },
  { label: "Team Members", value: "8 / 25", percent: 32 },
  { label: "AI Credits", value: "48,500 / 100,000", percent: 49 }
];

export function LicenseFooter() {
  return (
    <footer className="grid gap-4 rounded-[20px] border border-blue-100 bg-white/92 p-4 shadow-panel backdrop-blur lg:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
      <div className="min-w-0 border-blue-100 lg:border-r lg:pr-4">
        <p className="truncate text-xs font-bold text-slate-500">Plan: Enterprise Beta</p>
        <p className="truncate text-xs font-semibold text-slate-600">License enforcement not active</p>
      </div>
      {usage.map((item) => (
        <div key={item.label} className="min-w-0 border-blue-100 lg:border-r lg:px-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-bold text-slate-600">{item.label}</p>
            <p className="shrink-0 text-xs font-semibold text-slate-500">{item.value}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-royal to-electric" style={{ width: `${item.percent}%` }} />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <p className="text-xs font-bold text-slate-600">API Status</p>
        <StatusPill>Operational</StatusPill>
      </div>
    </footer>
  );
}
