"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Paperclip, RefreshCw, Search, Send, Smartphone } from "lucide-react";
import { apiRequest, getApiErrorMessage, type ListResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import {
  DataState,
  EmptyState,
  Toast,
  formatDate,
  initials,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  textareaClassName,
  useApiData,
  useToast
} from "./saas-page-utils";

type Contact = {
  id: string;
  name: string;
  phone: string;
  segment: string | null;
  stage: string;
};

type ConversationMessage = {
  id: string;
  body: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  subject: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  lastMessageAt: string | null;
  contact: Contact;
  messages: ConversationMessage[];
};

type MessageLog = {
  id: string;
  body: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  createdAt: string;
  contact?: Contact | null;
};

type SendAttemptResponse = {
  sent: boolean;
  provider: string;
  providerMessageId?: string;
  errorMessage?: string;
  message?: string;
};

const templates = [
  { name: "Custom Message", body: "Hi {{name}}, thanks for contacting ARBCore SwiftConnect." },
  { name: "Order Update", body: "Hi {{name}}, your order update is ready. Please reply if you need more details." },
  { name: "Payment Help", body: "Hi {{name}}, you can complete payment through the available secure payment option." },
  { name: "Support Follow-up", body: "Hi {{name}}, our support team is reviewing your request and will follow up shortly." }
];

export function InboxModulePage() {
  const conversations = useApiData<ListResponse<Conversation>>("/api/conversations?pageSize=100");
  const contacts = useApiData<ListResponse<Contact>>("/api/contacts?pageSize=200");
  const logs = useApiData<ListResponse<MessageLog>>("/api/messages/logs?pageSize=25");
  const { toast, showToast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<Conversation | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [quickSend, setQuickSend] = useState({ phone: "", template: templates[0].name, message: templates[0].body, scheduleAt: "" });
  const [busy, setBusy] = useState(false);

  const items = conversations.data?.items ?? [];
  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((conversation) =>
      [conversation.contact.name, conversation.contact.phone, conversation.subject ?? "", conversation.status].join(" ").toLowerCase().includes(normalized)
    );
  }, [items, query]);

  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].id);
  }, [items, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setThreadLoading(true);
    apiRequest<Conversation>(`/api/conversations/${selectedId}`)
      .then((conversation) => {
        if (active) {
          setThread(conversation);
          setQuickSend((current) => ({ ...current, phone: current.phone || conversation.contact.phone }));
        }
      })
      .catch((error) => showToast(getApiErrorMessage(error), "error"))
      .finally(() => {
        if (active) setThreadLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId, showToast]);

  const previewName = findContactByPhone(contacts.data?.items ?? [], quickSend.phone)?.name ?? "Customer";
  const preview = renderTemplate(quickSend.message, previewName);

  function updateTemplate(templateName: string) {
    const template = templates.find((item) => item.name === templateName) ?? templates[0];
    setQuickSend((current) => ({ ...current, template: templateName, message: template.body }));
  }

  async function sendReply() {
    if (!thread || !reply.trim()) return;
    setBusy(true);
    try {
      const message = await apiRequest<ConversationMessage>(`/api/conversations/${thread.id}`, {
        method: "POST",
        body: JSON.stringify({ body: reply, direction: "OUTBOUND", status: "QUEUED" })
      });
      setThread({ ...thread, messages: [...thread.messages, message] });
      setReply("");
      conversations.reload();
      logs.reload();
      showToast("Reply saved locally. WhatsApp Cloud API is required to send real messages.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  async function submitQuickSend(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const phone = quickSend.phone.trim();
    if (!phone || !preview.trim()) {
      showToast("Enter a phone number and message before sending.", "error");
      return;
    }

    setBusy(true);
    try {
      const result = await apiRequest<SendAttemptResponse>("/api/whatsapp/test-send", {
        method: "POST",
        body: JSON.stringify({ to: phone, body: preview })
      });
      contacts.reload();
      logs.reload();

      if (!result.sent) {
        showToast(result.message || result.errorMessage || "WhatsApp Cloud API is required to send real messages.", "error");
        return;
      }

      const contact = findContactByPhone(contacts.data?.items ?? [], phone);
      if (!contact) {
        showToast("Message sent through WhatsApp Cloud API.");
        return;
      }

      const existing = items.find((conversation) => conversation.contact.id === contact.id);
      if (existing) {
        const message = await apiRequest<ConversationMessage>(`/api/conversations/${existing.id}`, {
          method: "POST",
          body: JSON.stringify({ body: preview, direction: "OUTBOUND", status: quickSend.scheduleAt ? "QUEUED" : "SENT" })
        });
        if (thread?.id === existing.id) setThread({ ...thread, messages: [...thread.messages, message] });
        setSelectedId(existing.id);
      } else {
        const conversation = await apiRequest<Conversation>("/api/conversations", {
          method: "POST",
          body: JSON.stringify({ contactId: contact.id, subject: quickSend.template, body: preview })
        });
        setSelectedId(conversation.id);
      }
      conversations.reload();
      logs.reload();
      showToast(quickSend.scheduleAt ? "Message scheduled locally." : "Message sent through WhatsApp Cloud API.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
            <Smartphone className="h-8 w-8" />
          </span>
          <div>
            <p className="text-xs font-black uppercase text-royal">Message Desk</p>
            <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Send Messages</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Work from a polished inbox, reply to conversations, and send template-based local MVP messages.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(330px,410px)_1fr]">
        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
          <div className="mb-4 flex gap-2">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input className={`${inputClassName} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" />
            </label>
            <button className="grid h-11 w-11 place-items-center rounded-[14px] border border-blue-100 text-royal hover:bg-blue-50" onClick={conversations.reload} aria-label="Refresh conversations">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <DataState loading={conversations.loading} error={conversations.error} empty={!filteredConversations.length} emptyText="No conversations yet. Use quick send to start one.">
            <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {filteredConversations.map((conversation) => {
                const lastMessage = conversation.messages[conversation.messages.length - 1]?.body ?? conversation.subject ?? "No messages yet";
                const unread = conversation.messages.filter((message) => message.direction === "INBOUND" && message.status !== "READ").length;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={cn("w-full rounded-[18px] border p-3 text-left transition", selectedId === conversation.id ? "border-royal bg-blue-50 shadow-sm" : "border-blue-100 bg-white hover:bg-blue-50")}
                  >
                    <div className="flex gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal to-electric text-xs font-black text-white">{initials(conversation.contact.name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-black text-ink">{conversation.contact.name}</p>
                          <span className="shrink-0 text-[11px] font-bold text-slate-400">{formatDate(conversation.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">{conversation.contact.phone}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{lastMessage}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-royal ring-1 ring-blue-100">{conversation.status}</span>
                          {unread ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-royal px-2 text-[11px] font-black text-white">{unread}</span> : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </DataState>
        </section>

        <section className="grid gap-4 2xl:grid-cols-[1fr_360px]">
          <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
            <DataState loading={threadLoading} error={null} empty={!thread} emptyText="Select a conversation to open the chat window.">
              {thread ? (
                <div className="flex min-h-[650px] flex-col">
                  <div className="mb-4 flex items-center justify-between rounded-[18px] bg-blue-50 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal to-electric text-sm font-black text-white">{initials(thread.contact.name)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-ink">{thread.contact.name}</p>
                        <p className="text-xs font-semibold text-slate-500">{thread.contact.phone}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">{thread.status}</span>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto rounded-[18px] border border-blue-100 bg-slate-50 p-4">
                    {thread.messages.length ? (
                      thread.messages.map((message) => (
                        <div key={message.id} className={cn("flex", message.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[78%] rounded-[18px] px-4 py-3 text-sm font-semibold shadow-sm", message.direction === "OUTBOUND" ? "bg-royal text-white" : "bg-white text-slate-700")}>
                            <p>{message.body}</p>
                            <p className={cn("mt-2 text-[11px]", message.direction === "OUTBOUND" ? "text-blue-100" : "text-slate-400")}>{message.status} - {formatDate(message.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState text="No messages in this conversation yet." />
                    )}
                  </div>
                  <div className="mt-4 flex flex-col gap-3 lg:flex-row">
                    <textarea className={`${textareaClassName} min-h-20 flex-1`} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply" />
                    <button className={`${primaryButtonClassName} lg:self-end`} onClick={() => void sendReply()} disabled={!reply.trim() || busy}>
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                </div>
              ) : null}
            </DataState>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
              <h2 className="text-base font-black text-ink">Quick Send</h2>
              <form className="mt-4 space-y-3" onSubmit={(event) => void submitQuickSend(event)}>
                <input className={`${inputClassName} w-full`} value={quickSend.phone} onChange={(event) => setQuickSend({ ...quickSend, phone: event.target.value })} placeholder="Recipient phone number" required />
                <select className={`${inputClassName} w-full`} value={quickSend.template} onChange={(event) => updateTemplate(event.target.value)}>
                  {templates.map((template) => <option key={template.name} value={template.name}>{template.name}</option>)}
                </select>
                <textarea className={`${textareaClassName} w-full`} value={quickSend.message} onChange={(event) => setQuickSend({ ...quickSend, message: event.target.value })} placeholder="Message" />
                <div className="rounded-[16px] border border-dashed border-blue-200 bg-blue-50 p-4 text-sm font-bold text-slate-500">
                  <Paperclip className="mb-2 h-4 w-4 text-royal" />
                  Attachment placeholder for future WhatsApp media uploads.
                </div>
                <input className={`${inputClassName} w-full`} type="datetime-local" value={quickSend.scheduleAt} onChange={(event) => setQuickSend({ ...quickSend, scheduleAt: event.target.value })} />
                <div className="rounded-[16px] bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase text-royal">Preview</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{preview}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className={primaryButtonClassName} disabled={busy}>
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                  <button className={secondaryButtonClassName} type="button" onClick={() => void submitQuickSend()} disabled={busy || !quickSend.scheduleAt}>
                    <CalendarClock className="h-4 w-4" />
                    Schedule
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
              <h2 className="text-base font-black text-ink">Recent Logs</h2>
              <DataState loading={logs.loading} error={logs.error} empty={!logs.data?.items.length} emptyText="No message logs yet.">
                <div className="mt-4 space-y-2">
                  {(logs.data?.items ?? []).slice(0, 6).map((log) => (
                    <div key={log.id} className="rounded-[16px] border border-blue-100 bg-white p-3">
                      <p className="truncate text-xs font-black text-ink">{log.contact?.name ?? "Workspace Message"}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{log.body}</p>
                      <p className="mt-2 text-[11px] font-black text-royal">{log.direction} - {log.status}</p>
                    </div>
                  ))}
                </div>
              </DataState>
            </section>
          </aside>
        </section>
      </section>

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function findContactByPhone(contacts: Contact[], phone: string) {
  const normalized = normalizePhone(phone);
  return contacts.find((contact) => normalizePhone(contact.phone) === normalized);
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function renderTemplate(template: string, name: string) {
  return template.replace(/\{\{name\}\}/g, name);
}
