"use client";

import { BadgeCheck, MessageCircle, Settings2 } from "lucide-react";
import { Panel, TinyLink } from "./panel";
import { StatusPill } from "./status-pill";

export function WhatsAppConnection() {
  return (
    <Panel
      title="WhatsApp Connection"
      action={<TinyLink>View All</TinyLink>}
      className="xl:col-span-4"
    >
      <div className="rounded-[20px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/50">
        <div className="flex flex-wrap items-center gap-4 border-b border-blue-100 p-4">
          <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-emerald-700 shadow-sm">
            <span className="relative h-6 w-8 rounded-sm bg-emerald-900">
              <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500" />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex min-w-0 flex-wrap items-center gap-2 text-base font-black text-ink">
              <span className="truncate">+880 1712-345678</span>
              <BadgeCheck className="h-5 w-5 shrink-0 fill-royal text-white" />
            </p>
            <p className="truncate text-xs font-medium text-slate-500">Acme Digital Solutions Official</p>
          </div>
          <StatusPill>Connected</StatusPill>
        </div>

        <div className="space-y-4 p-4">
          <ConnectionRow label="Quality" value="Good" positive />
          <ConnectionRow label="Status" value="Connected" positive />
          <ConnectionRow label="Last Sync" value="2 mins ago" />
          <div>
            <ConnectionRow label="Messages (24h)" value="2,842 / 10,000" />
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[28%] rounded-full bg-gradient-to-r from-royal to-electric" />
            </div>
            <p className="mt-1 text-right text-xs font-semibold text-slate-500">28%</p>
          </div>
        </div>
      </div>
      <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-white text-sm font-bold text-royal transition hover:bg-blue-50">
        <Settings2 className="h-4 w-4" />
        Manage Connections
      </button>
    </Panel>
  );
}

function ConnectionRow({
  label,
  value,
  positive
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-blue-100 pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <span className={positive ? "text-xs font-bold text-emerald-600" : "text-xs font-semibold text-slate-600"}>
        {value}
      </span>
    </div>
  );
}

export function WhatsAppBadge() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
      <MessageCircle className="h-4 w-4" />
    </span>
  );
}
