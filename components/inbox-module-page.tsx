"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cable, ClipboardList, Inbox, MessageCircle, RefreshCw, Search } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import {
  DataState,
  EmptyState,
  formatDate,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName
} from "./saas-page-utils";

type ChannelFilter = "ALL" | "WHATSAPP" | "MESSENGER";

type ConversationSummary = {
  id: string;
  channel: "WHATSAPP" | "MESSENGER";
  contactKey: string;
  displayName: string | null;
  lastMessagePreview: string;
  lastDirection: "INBOUND" | "OUTBOUND";
  lastStatus: string;
  lastMessageAt: string;
  messageCount: number;
  failedCount: number;
  inboundCount: number;
  outboundCount: number;
};

type InboxMessage = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  body: string;
  bodyPreview: string;
  providerMessageId: string | null;
  errorMessage: string | null;
  createdAt: string;
};

type ConversationsResponse = {
  success: boolean;
  data: {
    conversations: ConversationSummary[];
  };
  error?: string;
};

type ConversationDetailResponse = {
  success: boolean;
  data: {
    conversation: {
      channel: "WHATSAPP" | "MESSENGER";
      contactKey: string;
      displayName: string | null;
    };
    messages: InboxMessage[];
  };
  error?: string;
};

export function InboxModulePage() {
  const [channel, setChannel] = useState<ChannelFilter>("ALL");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ channel, limit: "50" });
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/inbox/conversations?${params.toString()}`);
      const result = (await response.json()) as ConversationsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load inbox conversations.");
      }

      setConversations(result.data.conversations);
      setSelectedId((current) => {
        if (current && result.data.conversations.some((conversation) => conversation.id === current)) {
          return current;
        }

        return result.data.conversations[0]?.id ?? null;
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setConversations([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [channel, search]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let active = true;
    setDetailLoading(true);
    setDetailError(null);

    fetch(`/api/inbox/conversations/${encodeURIComponent(selectedId)}`)
      .then(async (response) => {
        const result = (await response.json()) as ConversationDetailResponse;

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load inbox conversation.");
        }

        if (active) setDetail(result.data);
      })
      .catch((requestError) => {
        if (active) {
          setDetail(null);
          setDetailError(getApiErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  function clearFilters() {
    setChannel("ALL");
    setSearch("");
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <Inbox className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Unified Inbox</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Customer Conversations</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Read WhatsApp and Messenger customer conversations in one place. Phase 1 is read-only; replies still happen through Send Messages or live Auto Reply.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={secondaryButtonClassName} href="/channels">
              <Cable className="h-4 w-4" />
              Channel Center
            </Link>
            <Link className={secondaryButtonClassName} href="/message-logs">
              <ClipboardList className="h-4 w-4" />
              Message Logs
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto_auto]">
          <select className={`${inputClassName} w-full`} value={channel} onChange={(event) => setChannel(event.target.value as ChannelFilter)}>
            <option value="ALL">All channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="MESSENGER">Messenger</option>
          </select>
          <label className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              className={`${inputClassName} w-full pl-9`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search phone, PSID, provider ID, or message preview"
            />
          </label>
          <button className={primaryButtonClassName} onClick={() => void loadConversations()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className={secondaryButtonClassName} onClick={clearFilters}>
            Clear
          </button>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Messenger uses Facebook PSID, not phone number. Technical provider details remain available in Message Logs.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(330px,430px)_1fr]">
        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-ink">Conversations</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">{conversations.length} visible thread{conversations.length === 1 ? "" : "s"}</p>
            </div>
            <button className="grid h-11 w-11 place-items-center rounded-[14px] border border-blue-100 text-royal hover:bg-blue-50" onClick={() => void loadConversations()} aria-label="Refresh inbox">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <DataState loading={loading} error={error} empty={!conversations.length} emptyText="No inbox conversations match the current filters.">
            <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={cn(
                    "w-full rounded-[18px] border p-3 text-left transition",
                    selectedId === conversation.id ? "border-royal bg-blue-50 shadow-sm" : "border-blue-100 bg-white hover:bg-blue-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal to-electric text-white">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-ink">{conversation.displayName ?? conversation.contactKey}</p>
                        <span className="shrink-0 text-[11px] font-bold text-slate-400">{formatDate(conversation.lastMessageAt)}</span>
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{conversation.contactKey}</p>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{conversation.lastMessagePreview || "No message preview"}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusPill label={conversation.channel} tone={conversation.channel === "WHATSAPP" ? "blue" : "purple"} />
                        <StatusPill label={conversation.lastDirection} tone={conversation.lastDirection === "INBOUND" ? "green" : "blue"} />
                        <StatusPill label={conversation.lastStatus} tone={conversation.lastStatus === "FAILED" ? "red" : "gray"} />
                        {conversation.failedCount ? <StatusPill label={`${conversation.failedCount} failed`} tone="red" /> : null}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </DataState>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
          <DataState loading={detailLoading} error={detailError} empty={!selectedId || !detail} emptyText="Select a conversation to view recent messages.">
            {detail ? (
              <div className="flex min-h-[680px] flex-col">
                <div className="mb-4 flex flex-col gap-3 rounded-[18px] bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-royal">{detail.conversation.channel}</p>
                    <h2 className="mt-1 truncate text-lg font-black text-ink">{detail.conversation.displayName ?? detail.conversation.contactKey}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{detail.conversation.contactKey}</p>
                  </div>
                  {selectedConversation ? (
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={`${selectedConversation.messageCount} messages`} tone="gray" />
                      <StatusPill label={`${selectedConversation.inboundCount} inbound`} tone="green" />
                      <StatusPill label={`${selectedConversation.outboundCount} outbound`} tone="blue" />
                    </div>
                  ) : null}
                </div>

                <div className="soft-scrollbar flex-1 space-y-3 overflow-y-auto rounded-[18px] border border-blue-100 bg-slate-50 p-4">
                  {detail.messages.length ? (
                    detail.messages.map((message) => (
                      <div key={message.id} className={cn("flex", message.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[82%] rounded-[18px] px-4 py-3 text-sm font-semibold shadow-sm",
                            message.direction === "OUTBOUND" ? "bg-royal text-white" : "bg-white text-slate-700"
                          )}
                        >
                          <p className="whitespace-pre-wrap leading-6">{message.body || message.bodyPreview}</p>
                          <div className={cn("mt-3 flex flex-wrap items-center gap-2 text-[11px]", message.direction === "OUTBOUND" ? "text-blue-100" : "text-slate-400")}>
                            <span>{message.direction}</span>
                            <span>{message.status}</span>
                            <span>{formatDate(message.createdAt)}</span>
                          </div>
                          {message.providerMessageId ? (
                            <p className={cn("mt-1 truncate text-[11px]", message.direction === "OUTBOUND" ? "text-blue-100" : "text-slate-400")}>
                              Provider ID: {message.providerMessageId}
                            </p>
                          ) : null}
                          {message.errorMessage ? (
                            <p className="mt-2 rounded-[12px] bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                              {message.errorMessage}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState text="No messages were found for this conversation." />
                  )}
                </div>

                <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                  Inbox is read-only in Phase 1. Use Send Messages for manual WhatsApp tests, Auto Reply for matching inbound keywords, and Message Logs for technical provider details.
                </div>
              </div>
            ) : null}
          </DataState>
        </section>
      </section>
    </AppShell>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "blue" | "green" | "gray" | "purple" | "red" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-black uppercase ring-1",
        tone === "blue" && "bg-blue-50 text-royal ring-blue-100",
        tone === "green" && "bg-emerald-50 text-emerald-700 ring-emerald-100",
        tone === "gray" && "bg-slate-50 text-slate-600 ring-slate-200",
        tone === "purple" && "bg-violet-50 text-violet-700 ring-violet-100",
        tone === "red" && "bg-rose-50 text-rose-700 ring-rose-100"
      )}
    >
      {label}
    </span>
  );
}
