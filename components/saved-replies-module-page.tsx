"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, Edit3, MessageSquareQuote, Plus, RefreshCw, Search } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import {
  DataState,
  Toast,
  formatDate,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  useToast
} from "./saas-page-utils";

type SavedReply = {
  id: string;
  title: string;
  category: string;
  body: string;
  shortcut: string;
  channel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type SavedRepliesResponse =
  | { success: true; data: { replies: SavedReply[] } }
  | { success: false; error: string };

type SavedReplyResponse =
  | { success: true; data: { reply: SavedReply } }
  | { success: false; error: string };

type SavedReplyForm = {
  title: string;
  category: string;
  shortcut: string;
  channel: string;
  body: string;
  status: string;
};

const categories = ["GENERAL", "PRICE", "SIZE", "DELIVERY", "COD", "ORDER", "PAYMENT", "SUPPORT", "COMPLAINT", "FOLLOW_UP"];
const channels = ["ALL", "WHATSAPP", "MESSENGER"];
const statuses = ["ACTIVE", "ARCHIVED"];

const emptyForm: SavedReplyForm = {
  title: "",
  category: "GENERAL",
  shortcut: "",
  channel: "ALL",
  body: "",
  status: "ACTIVE"
};

const suggestions: SavedReplyForm[] = [
  {
    title: "Price details",
    category: "PRICE",
    shortcut: "price",
    channel: "ALL",
    status: "ACTIVE",
    body: "Thanks for your message. Please share the model name or product screenshot, and our team will confirm the latest price shortly."
  },
  {
    title: "Size guide",
    category: "SIZE",
    shortcut: "size",
    channel: "ALL",
    status: "ACTIVE",
    body: "Please share your usual shoe size or foot length. We will help you choose the right size before confirming the order."
  },
  {
    title: "Delivery charge",
    category: "DELIVERY",
    shortcut: "delivery",
    channel: "ALL",
    status: "ACTIVE",
    body: "Delivery charge depends on your location. Please share your full delivery area so we can confirm the delivery cost."
  },
  {
    title: "COD available",
    category: "COD",
    shortcut: "cod",
    channel: "ALL",
    status: "ACTIVE",
    body: "Cash on Delivery is available for selected areas. Please share your delivery location so our team can confirm COD availability."
  },
  {
    title: "Order confirmation",
    category: "ORDER",
    shortcut: "confirm",
    channel: "ALL",
    status: "ACTIVE",
    body: "Thanks. We have received your order details. Our team will review availability and confirm the order shortly."
  },
  {
    title: "Payment request",
    category: "PAYMENT",
    shortcut: "payment",
    channel: "ALL",
    status: "ACTIVE",
    body: "Please complete the payment using the approved business payment method and share the transaction reference for confirmation."
  },
  {
    title: "Human support",
    category: "SUPPORT",
    shortcut: "support",
    channel: "ALL",
    status: "ACTIVE",
    body: "Thanks for reaching out. A team member will review your message and reply shortly."
  },
  {
    title: "Complaint received",
    category: "COMPLAINT",
    shortcut: "complaint",
    channel: "ALL",
    status: "ACTIVE",
    body: "We are sorry for the inconvenience. Please share your order ID, phone number, and issue details so our support team can review it."
  }
];

export function SavedRepliesModulePage() {
  const { toast, showToast } = useToast();
  const [replies, setReplies] = useState<SavedReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SavedReplyForm>(emptyForm);
  const [filters, setFilters] = useState(getInitialSavedReplyFilters());

  const editingReply = useMemo(() => replies.find((reply) => reply.id === editingId) ?? null, [editingId, replies]);

  async function loadReplies() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        category: filters.category,
        channel: filters.channel,
        status: filters.status,
        limit: "500"
      });
      if (filters.search.trim()) params.set("search", filters.search.trim());

      const response = await fetch(`/api/saved-replies?${params.toString()}`);
      const result = (await response.json()) as SavedRepliesResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.success ? "Failed to load saved replies." : result.error);
      }

      setReplies(result.data.replies);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReplies();
  }, []);

  function editReply(reply: SavedReply) {
    setEditingId(reply.id);
    setForm({
      title: reply.title,
      category: reply.category,
      shortcut: reply.shortcut,
      channel: reply.channel,
      body: reply.body,
      status: reply.status
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(editingId ? `/api/saved-replies/${editingId}` : "/api/saved-replies", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = (await response.json()) as SavedReplyResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.success ? "Failed to save reply." : result.error);
      }

      showToast(editingId ? "Saved reply updated." : "Saved reply created.");
      resetForm();
      await loadReplies();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError), "error");
    } finally {
      setSaving(false);
    }
  }

  async function archiveReply(reply: SavedReply) {
    if (!window.confirm(`Archive "${reply.title}"?`)) return;

    try {
      const response = await fetch(`/api/saved-replies/${reply.id}`, { method: "DELETE" });
      const result = (await response.json()) as SavedReplyResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.success ? "Failed to archive reply." : result.error);
      }

      showToast("Saved reply archived.");
      await loadReplies();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError), "error");
    }
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <MessageSquareQuote className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Inbox Productivity</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Saved Replies</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Create reusable text replies for Inbox operators. Saved replies insert into the composer only; staff must review and click Send.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={() => void loadReplies()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
        <h2 className="text-base font-black text-ink">Suggested Replies</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500">Click a suggestion to pre-fill the form. Nothing is saved until you click Save.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.shortcut}
              className="rounded-[16px] border border-blue-100 bg-blue-50 p-3 text-left text-sm font-bold text-royal hover:bg-blue-100"
              onClick={() => {
                setEditingId(null);
                setForm(suggestion);
              }}
            >
              {suggestion.title}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <form className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel" onSubmit={saveReply}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-ink">{editingReply ? "Edit Saved Reply" : "Create Saved Reply"}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Text only in Phase 1. No media and no auto-send.</p>
            </div>
            {editingReply ? (
              <button className={secondaryButtonClassName} type="button" onClick={resetForm}>
                New
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            <input className={inputClassName} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" />
            <div className="grid gap-3 sm:grid-cols-3">
              <select className={inputClassName} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categories.map((category) => <option key={category} value={category}>{formatOption(category)}</option>)}
              </select>
              <select className={inputClassName} value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>
                {channels.map((channel) => <option key={channel} value={channel}>{formatOption(channel)}</option>)}
              </select>
              <select className={inputClassName} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {statuses.map((status) => <option key={status} value={status}>{formatOption(status)}</option>)}
              </select>
            </div>
            <input className={inputClassName} value={form.shortcut} onChange={(event) => setForm({ ...form, shortcut: event.target.value })} placeholder="Shortcut, e.g. price" />
            <textarea className={`${inputClassName} min-h-44 py-3`} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Reply body" />
            <button className={primaryButtonClassName} type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? "Saving..." : editingReply ? "Save Changes" : "Save Reply"}
            </button>
          </div>
        </form>

        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[150px_150px_150px_1fr_auto]">
            <select className={inputClassName} value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="ALL">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{formatOption(category)}</option>)}
            </select>
            <select className={inputClassName} value={filters.channel} onChange={(event) => setFilters({ ...filters, channel: event.target.value })}>
              <option value="ALL">All channels</option>
              {channels.map((channel) => <option key={channel} value={channel}>{formatOption(channel)}</option>)}
            </select>
            <select className={inputClassName} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="ALL">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{formatOption(status)}</option>)}
            </select>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input className={`${inputClassName} w-full pl-9`} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search title, shortcut, body" />
            </label>
            <button className={primaryButtonClassName} onClick={() => void loadReplies()}>
              Apply
            </button>
          </div>

          <div className="mt-5">
            <DataState loading={loading} error={error} empty={!replies.length} emptyText="No saved replies match this view.">
              <div className="space-y-3">
                {replies.map((reply) => (
                  <article key={reply.id} className="rounded-[18px] border border-blue-100 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-ink">{reply.title}</h3>
                          <Badge text={formatOption(reply.category)} />
                          <Badge text={formatOption(reply.channel)} />
                          <Badge text={formatOption(reply.status)} muted={reply.status === "ARCHIVED"} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{reply.body}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-400">Shortcut: {reply.shortcut || "-"} · Updated {formatDate(reply.updatedAt)}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button className="grid h-10 w-10 place-items-center rounded-[12px] border border-blue-100 text-royal hover:bg-blue-50" type="button" onClick={() => editReply(reply)} aria-label="Edit saved reply">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {reply.status !== "ARCHIVED" ? (
                          <button className="grid h-10 w-10 place-items-center rounded-[12px] border border-rose-100 text-rose-600 hover:bg-rose-50" type="button" onClick={() => void archiveReply(reply)} aria-label="Archive saved reply">
                            <Archive className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </DataState>
          </div>
        </section>
      </section>

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function getInitialSavedReplyFilters() {
  if (typeof window === "undefined") {
    return { category: "ALL", channel: "ALL", status: "ACTIVE", search: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category")?.trim().toUpperCase() || "ALL",
    channel: params.get("channel")?.trim().toUpperCase() || "ALL",
    status: params.get("status")?.trim().toUpperCase() || "ACTIVE",
    search: params.get("search")?.trim() || ""
  };
}

function Badge({ text, muted }: { text: string; muted?: boolean }) {
  return <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ring-1 ${muted ? "bg-slate-50 text-slate-500 ring-slate-100" : "bg-blue-50 text-royal ring-blue-100"}`}>{text}</span>;
}

function formatOption(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
