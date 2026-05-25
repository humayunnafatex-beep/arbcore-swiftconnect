"use client";

import { Check, MessageCircle } from "lucide-react";
import { recentChats, recentReplies } from "@/data/dashboard";
import { Panel, TinyLink } from "./panel";
import { AssistantChip } from "./auto-reply-assistant";

export function RecentActivity() {
  return (
    <div className="space-y-4 xl:col-span-3 xl:row-span-2">
      <Panel title="Recent Chats" action={<TinyLink>View All</TinyLink>}>
        <div className="space-y-1">
          {recentChats.map((chat, index) => (
            <button
              key={chat.name}
              className="flex min-h-[62px] w-full items-center gap-3 rounded-[16px] px-2 text-left transition hover:bg-blue-50"
            >
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-black text-slate-700">
                {chat.avatar}
                <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                  <MessageCircle className="h-3 w-3" />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-ink">{chat.name}</span>
                <span className="block truncate text-xs font-medium text-slate-500">{chat.message}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[11px] font-semibold text-slate-500">{chat.time}</span>
                {chat.unread ? (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-royal px-1 text-xs font-black text-white">
                    {chat.unread}
                  </span>
                ) : (
                  <span className="h-6" />
                )}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Recent Replies" action={<TinyLink>View All</TinyLink>}>
        <div className="space-y-3">
          {recentReplies.map((reply) => (
            <div key={reply.title} className="flex min-h-[64px] items-center gap-3 rounded-[16px] border border-blue-50 bg-white px-3 shadow-sm">
              <AssistantChip />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-ink">{reply.title}</span>
                <span className="block truncate text-xs font-medium text-slate-500">{reply.message}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-[11px] font-semibold text-slate-500">{reply.time}</span>
                <Check className="h-4 w-4 text-emerald-600" />
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
