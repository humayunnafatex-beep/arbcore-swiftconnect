"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cable, ClipboardList, Inbox, MessageCircle, Paperclip, RefreshCw, Search, Send, XCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-client";
import { getContactStatusLabel, getContactStatusOptions, normalizeContactStatus, type ContactStatusValue } from "@/lib/contact-status";
import { parseTags, stringifyTags } from "@/lib/contact-tags";
import { getOrderMessageTemplates, type OrderMessageTemplateId } from "@/lib/order-message-templates";
import { parseAvailableSizes } from "@/lib/product-input";
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
type ConversationStatus = "OPEN" | "PENDING" | "CLOSED";
type StatusFilter = "ALL" | ConversationStatus;
type FollowUpStatus = "NONE" | "DUE" | "UPCOMING" | "DONE";
type FollowUpFilter = "ALL" | FollowUpStatus;
type ReplyStatus = "not_configured" | "validation_failed" | "provider_error" | "sent_successfully";
type ContactStage = ContactStatusValue;

type Assignee = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type LinkedContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: ContactStage | string | null;
  tags: string | null;
};

type ConversationSummary = {
  id: string;
  channel: "WHATSAPP" | "MESSENGER";
  contactKey: string;
  displayName: string | null;
  lastMessagePreview: string;
  lastDirection: "INBOUND" | "OUTBOUND";
  lastStatus: string;
  lastMessageAt: string;
  status: ConversationStatus;
  assignedTo: Assignee | null;
  contact: LinkedContact | null;
  internalNotePreview: string;
  followUpAt: string | null;
  followUpDone: boolean;
  followUpStatus: FollowUpStatus;
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
      contact: LinkedContact | null;
      internalNote: string;
      followUpAt: string | null;
      followUpDone: boolean;
      followUpStatus: FollowUpStatus;
    };
    messages: InboxMessage[];
  };
  error?: string;
};

type ReplyResponse = {
  success: boolean;
  status: ReplyStatus;
  error?: string;
  providerError?: {
    message?: string;
    type?: string;
    code?: number | string;
    subcode?: number | string;
    fbtraceId?: string;
  };
};

type AssigneesResponse = {
  success: boolean;
  data: {
    users: Assignee[];
  };
  error?: string;
};

type StateResponse = {
  success: boolean;
  data: {
    status: ConversationStatus;
    assignedTo: Assignee | null;
    internalNote: string;
    followUpAt: string | null;
    followUpDone: boolean;
    followUpStatus: FollowUpStatus;
  };
  error?: string;
};

type ContactResponse = {
  success: boolean;
  data?: {
    contact: LinkedContact;
  };
  error?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  modelName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  deliveryCharge: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentStatus: string;
  orderStatus: string;
  followUpAt: string | null;
  followUpDone: boolean;
  notes: string;
  updatedAt: string;
};

type OrdersResponse = {
  success: boolean;
  data?: {
    orders: Order[];
  };
  error?: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  availableSizes: string;
  stockNote: string;
};

type ProductsResponse = {
  success: boolean;
  data?: {
    products: Product[];
  };
};

type OrderMessagePreviewResponse = {
  success: boolean;
  data?: {
    message: string;
    templateLabel: string;
  };
  error?: string;
};

type ContactForm = {
  name: string;
  email: string;
  status: ContactStage;
  tags: string;
};

const emptyContactForm: ContactForm = {
  name: "",
  email: "",
  status: "NEW_LEAD",
  tags: ""
};

const emptyOrderForm = {
  modelName: "",
  size: "",
  quantity: "1",
  unitPrice: "0",
  deliveryCharge: "0",
  customerName: "",
  customerPhone: "",
  deliveryAddress: "",
  paymentStatus: "UNPAID",
  orderStatus: "DRAFT",
  notes: ""
};

const contactStages = getContactStatusOptions();
const orderMessageTemplates = getOrderMessageTemplates();

const replyStatusText: Record<ReplyStatus, string> = {
  not_configured: "This channel is not configured for real replies.",
  validation_failed: "Please check the recipient and message.",
  provider_error: "The provider rejected the reply.",
  sent_successfully: "Reply sent successfully through the provider."
};

const allowedReplyAttachmentTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const imageReplyMaxBytes = 5 * 1024 * 1024;
const pdfReplyMaxBytes = 10 * 1024 * 1024;

export function InboxModulePage() {
  const initialFilters = getInitialFilters();
  const [channel, setChannel] = useState<ChannelFilter>(initialFilters.channel);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialFilters.status);
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>(initialFilters.followUp);
  const [assignedToFilter, setAssignedToFilter] = useState(initialFilters.assignedTo);
  const [contactStatusFilter, setContactStatusFilter] = useState(initialFilters.contactStatus);
  const [contactTagFilter, setContactTagFilter] = useState(initialFilters.contactTag);
  const [search, setSearch] = useState("");
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [replyStatus, setReplyStatus] = useState<ReplyStatus | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyProviderError, setReplyProviderError] = useState<string | null>(null);
  const [replySending, setReplySending] = useState(false);
  const [draftState, setDraftState] = useState<{ status: ConversationStatus; assignedToId: string }>({
    status: "OPEN",
    assignedToId: "UNASSIGNED"
  });
  const [internalDraft, setInternalDraft] = useState<{ internalNote: string; followUpAt: string; followUpDone: boolean }>({
    internalNote: "",
    followUpAt: "",
    followUpDone: false
  });
  const [stateSaving, setStateSaving] = useState(false);
  const [stateMessage, setStateMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactMessage, setContactMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [orderTemplateById, setOrderTemplateById] = useState<Record<string, OrderMessageTemplateId>>({});
  const [preparingOrderMessageId, setPreparingOrderMessageId] = useState<string | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );
  const selectedProductSizes = useMemo(
    () => parseAvailableSizes(selectedProduct?.availableSizes),
    [selectedProduct?.availableSizes]
  );

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        channel,
        status: statusFilter,
        followUp: followUpFilter,
        assignedTo: assignedToFilter,
        contactStatus: contactStatusFilter,
        contactTag: contactTagFilter,
        limit: "50"
      });
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
  }, [assignedToFilter, channel, contactStatusFilter, contactTagFilter, followUpFilter, search, statusFilter]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let active = true;

    fetch("/api/inbox/assignees")
      .then(async (response) => {
        const result = (await response.json()) as AssigneesResponse;
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load inbox assignees.");
        }
        if (active) setAssignees(result.data.users);
      })
      .catch(() => {
        if (active) setAssignees([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/products?status=ACTIVE&limit=500")
      .then(async (response) => {
        const result = (await response.json()) as ProductsResponse;
        if (!response.ok || result.success === false) throw new Error("Failed to load products.");
        if (active) setProducts(result.data?.products ?? []);
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadConversationDetail = useCallback(async (conversationId: string) => {
    const response = await fetch(`/api/inbox/conversations/${encodeURIComponent(conversationId)}`);
    const result = (await response.json()) as ConversationDetailResponse;

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to load inbox conversation.");
    }

    setDetail(result.data);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let active = true;
    setDetailLoading(true);
    setDetailError(null);

    loadConversationDetail(selectedId)
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
  }, [loadConversationDetail, selectedId]);

  useEffect(() => {
    if (!selectedConversation) return;

    setDraftState({
      status: selectedConversation.status,
      assignedToId: selectedConversation.assignedTo?.id ?? "UNASSIGNED"
    });
    setStateMessage(null);
  }, [selectedConversation]);

  useEffect(() => {
    const contact = detail?.conversation.contact;

    setContactMessage(null);
    setContactForm(contact
      ? {
          name: contact.name,
          email: contact.email ?? "",
          status: normalizeContactStatus(contact.status),
          tags: contact.tags ?? ""
        }
      : emptyContactForm);
  }, [detail?.conversation.contact]);

  useEffect(() => {
    if (!detail) return;

    setInternalDraft({
      internalNote: detail.conversation.internalNote,
      followUpAt: toDateTimeLocalValue(detail.conversation.followUpAt),
      followUpDone: detail.conversation.followUpDone
    });
  }, [detail]);

  useEffect(() => {
    if (!selectedId) {
      setOrders([]);
      setOrderForm(emptyOrderForm);
      setSelectedProductId("");
      return;
    }

    void loadConversationOrders(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const contact = detail?.conversation.contact;
    setOrderForm((current) => ({
      ...current,
      customerName: current.customerName || contact?.name || detail?.conversation.displayName || "",
      customerPhone: current.customerPhone || contact?.phone || detail?.conversation.contactKey || ""
    }));
  }, [detail]);

  async function sendReply() {
    if (!detail) return;

    const body = replyBody.trim();
    setReplyStatus(null);
    setReplyError(null);
    setReplyProviderError(null);

    if (!body && !replyAttachment) {
      setReplyStatus("validation_failed");
      setReplyError("Reply message or image/PDF attachment is required.");
      return;
    }

    setReplySending(true);

    try {
      const requestInit = replyAttachment
        ? buildAttachmentReplyRequest({
            channel: detail.conversation.channel,
            contactKey: detail.conversation.contactKey,
            body,
            attachment: replyAttachment
          })
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel: detail.conversation.channel,
              contactKey: detail.conversation.contactKey,
              body
            })
          };

      const response = await fetch("/api/inbox/reply", {
        ...requestInit
      });
      const result = (await response.json()) as ReplyResponse;
      setReplyStatus(result.status);
      setReplyProviderError(formatProviderError(result.providerError));

      if (!response.ok || !result.success || result.status !== "sent_successfully") {
        setReplyError(result.error || replyStatusText[result.status] || "Reply was not sent.");
        if (selectedId && result.status !== "validation_failed") {
          await loadConversationDetail(selectedId).catch(() => undefined);
          await loadConversations().catch(() => undefined);
        }
        return;
      }

      setReplyBody("");
      clearReplyAttachment();
      if (selectedId) {
        await loadConversationDetail(selectedId);
        await loadConversations();
      }
    } catch (requestError) {
      setReplyStatus("provider_error");
      setReplyError(getApiErrorMessage(requestError));
      setReplyProviderError(null);
    } finally {
      setReplySending(false);
    }
  }

  function selectReplyAttachment(file: File | null) {
    setReplyStatus(null);
    setReplyError(null);
    setReplyProviderError(null);

    if (!file) {
      setReplyAttachment(null);
      return;
    }

    const validation = validateReplyAttachment(file);
    if (validation) {
      setReplyAttachment(null);
      setReplyStatus("validation_failed");
      setReplyError(validation);
      if (replyFileInputRef.current) replyFileInputRef.current.value = "";
      return;
    }

    setReplyAttachment(file);
  }

  function clearReplyAttachment() {
    setReplyAttachment(null);
    if (replyFileInputRef.current) replyFileInputRef.current.value = "";
  }

  function clearFilters() {
    setChannel("ALL");
    setStatusFilter("ALL");
    setFollowUpFilter("ALL");
    setAssignedToFilter("ALL");
    setContactStatusFilter("ALL");
    setContactTagFilter("");
    setSearch("");
  }

  async function saveConversationState(options?: { clearFollowUp?: boolean }) {
    if (!selectedId) return;

    setStateSaving(true);
    setStateMessage(null);

    try {
      const response = await fetch(`/api/inbox/conversations/${encodeURIComponent(selectedId)}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draftState.status,
          assignedToId: draftState.assignedToId === "UNASSIGNED" ? null : draftState.assignedToId,
          internalNote: internalDraft.internalNote,
          followUpAt: options?.clearFollowUp ? null : internalDraft.followUpAt || null,
          followUpDone: options?.clearFollowUp ? false : internalDraft.followUpDone
        })
      });
      const result = (await response.json()) as StateResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update conversation state.");
      }

      setStateMessage({ tone: "success", text: "Conversation state updated." });
      if (options?.clearFollowUp) {
        setInternalDraft((current) => ({ ...current, followUpAt: "", followUpDone: false }));
      }
      await loadConversationDetail(selectedId);
      await loadConversations();
    } catch (requestError) {
      setStateMessage({ tone: "error", text: getApiErrorMessage(requestError) });
    } finally {
      setStateSaving(false);
    }
  }

  async function saveContactFromConversation() {
    if (!selectedId || !detail) return;

    const name = contactForm.name.trim();
    const email = contactForm.email.trim();

    setContactMessage(null);

    if (!name) {
      setContactMessage({ tone: "error", text: "Contact name is required." });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setContactMessage({ tone: "error", text: "Enter a valid email address or leave it blank." });
      return;
    }

    setContactSaving(true);

    try {
      const linkedContact = detail.conversation.contact;
      const payload = {
        name,
        email: email || null,
        status: normalizeContactStatus(contactForm.status),
        stage: normalizeContactStatus(contactForm.status),
        tags: stringifyTags(contactForm.tags) ?? null
      };
      const response = await fetch(
        linkedContact ? `/api/contacts/${linkedContact.id}` : `/api/inbox/conversations/${encodeURIComponent(selectedId)}/contact`,
        {
          method: linkedContact ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const result = (await response.json()) as ContactResponse;

      if (!response.ok || result.success === false) {
        throw new Error(typeof result.error === "string" ? result.error : "Failed to save contact.");
      }

      setContactMessage({ tone: "success", text: linkedContact ? "Contact updated." : "Contact created and linked." });
      await loadConversationDetail(selectedId);
      await loadConversations();
    } catch (requestError) {
      setContactMessage({ tone: "error", text: getApiErrorMessage(requestError) });
    } finally {
      setContactSaving(false);
    }
  }

  async function loadConversationOrders(conversationId: string) {
    try {
      const response = await fetch(`/api/inbox/conversations/${encodeURIComponent(conversationId)}/orders`);
      const result = (await response.json()) as OrdersResponse;
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to load conversation orders.");
      setOrders(result.data?.orders ?? []);
    } catch {
      setOrders([]);
    }
  }

  async function saveOrderFromConversation() {
    if (!selectedId) return;

    setOrderSaving(true);
    setOrderMessage(null);

    try {
      const response = await fetch(`/api/inbox/conversations/${encodeURIComponent(selectedId)}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderForm,
          quantity: Number(orderForm.quantity),
          unitPrice: Number(orderForm.unitPrice),
          deliveryCharge: Number(orderForm.deliveryCharge)
        })
      });
      const result = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Failed to save order.");
      setOrderMessage({ tone: "success", text: "Order saved." });
      setOrderForm(emptyOrderForm);
      setSelectedProductId("");
      await loadConversationOrders(selectedId);
      await loadConversations();
    } catch (error) {
      setOrderMessage({ tone: "error", text: getApiErrorMessage(error) });
    } finally {
      setOrderSaving(false);
    }
  }

  function applyProductToOrder(productId: string) {
    setSelectedProductId(productId);
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const sizes = parseAvailableSizes(product.availableSizes);

    setOrderForm((current) => ({
      ...current,
      modelName: product.name,
      unitPrice: String(product.price),
      size: current.size || sizes[0] || ""
    }));
  }

  async function prepareOrderMessage(orderId: string) {
    const templateId = orderTemplateById[orderId] ?? "ORDER_CONFIRMATION";
    setPreparingOrderMessageId(orderId);
    setOrderMessage(null);
    setReplyStatus(null);
    setReplyError(null);
    setReplyProviderError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/message-preview?templateId=${encodeURIComponent(templateId)}`);
      const result = (await response.json()) as OrderMessagePreviewResponse;
      if (!response.ok || !result.success || !result.data?.message) {
        throw new Error(result.error || "Failed to prepare order message.");
      }

      setReplyBody(result.data.message);
      setOrderMessage({ tone: "success", text: `${result.data.templateLabel} prepared. Review the message, then click Send Reply.` });
    } catch (error) {
      setOrderMessage({ tone: "error", text: getApiErrorMessage(error) });
    } finally {
      setPreparingOrderMessageId(null);
    }
  }

  async function updateOrderFollowUp(order: Order, patch: { followUpAt: string | null; followUpDone: boolean }) {
    setOrderMessage(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const result = (await response.json()) as { success: boolean; error?: unknown };
      if (!response.ok || !result.success) {
        const message = typeof result.error === "string" ? result.error : "Failed to update order follow-up.";
        throw new Error(message);
      }

      setOrderMessage({ tone: "success", text: "Order follow-up updated. No customer message was sent." });
      if (selectedId) await loadConversationOrders(selectedId);
    } catch (error) {
      setOrderMessage({ tone: "error", text: getApiErrorMessage(error) });
    }
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
                Read, link contacts, assign, update status, and reply to WhatsApp and Messenger customer conversations in one place.
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[140px_140px_155px_180px_165px_minmax(220px,1fr)_150px_auto_auto]">
          <select className={`${inputClassName} w-full`} value={channel} onChange={(event) => setChannel(event.target.value as ChannelFilter)}>
            <option value="ALL">All channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="MESSENGER">Messenger</option>
          </select>
          <select className={`${inputClassName} w-full`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="PENDING">Pending</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select className={`${inputClassName} w-full`} value={followUpFilter} onChange={(event) => setFollowUpFilter(event.target.value as FollowUpFilter)}>
            <option value="ALL">All follow-ups</option>
            <option value="NONE">No follow-up</option>
            <option value="DUE">Due</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="DONE">Done</option>
          </select>
          <select className={`${inputClassName} w-full`} value={assignedToFilter} onChange={(event) => setAssignedToFilter(event.target.value)}>
            <option value="ALL">All assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <select className={`${inputClassName} w-full`} value={contactStatusFilter} onChange={(event) => setContactStatusFilter(event.target.value)}>
            <option value="ALL">All lead statuses</option>
            {contactStages.map((stage) => (
              <option key={stage.value} value={stage.value}>{stage.label}</option>
            ))}
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
          <input
            className={`${inputClassName} w-full`}
            value={contactTagFilter}
            onChange={(event) => setContactTagFilter(event.target.value)}
            placeholder="Contact tag"
          />
          <button className={`${primaryButtonClassName} w-full sm:w-auto`} onClick={() => void loadConversations()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className={`${secondaryButtonClassName} w-full sm:w-auto`} onClick={clearFilters}>
            Clear
          </button>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Messenger uses Facebook PSID, not phone number. Technical provider details remain available in Message Logs.
        </p>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
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
            <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1 xl:max-h-[720px]">
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
                        <StatusPill label={conversation.status} tone={conversation.status === "OPEN" ? "green" : conversation.status === "PENDING" ? "blue" : "gray"} />
                        <StatusPill label={conversation.lastDirection} tone={conversation.lastDirection === "INBOUND" ? "green" : "blue"} />
                        <StatusPill label={conversation.lastStatus} tone={conversation.lastStatus === "FAILED" ? "red" : "gray"} />
                        {conversation.followUpStatus !== "NONE" ? <StatusPill label={formatFollowUpStatus(conversation.followUpStatus)} tone={followUpTone(conversation.followUpStatus)} /> : null}
                        {conversation.internalNotePreview ? <StatusPill label="Note" tone="purple" /> : null}
                        {conversation.failedCount ? <StatusPill label={`${conversation.failedCount} failed`} tone="red" /> : null}
                      </div>
                      {conversation.internalNotePreview ? (
                        <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-slate-500">Note: {conversation.internalNotePreview}</p>
                      ) : null}
                      <p className="mt-2 truncate text-[11px] font-bold text-slate-400">
                        {conversation.assignedTo ? `Assigned to ${conversation.assignedTo.name}` : "Unassigned"}
                      </p>
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
              <div className="flex min-h-0 flex-col xl:min-h-[680px]">
                <div className="mb-4 flex flex-col gap-3 rounded-[18px] bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-royal">{detail.conversation.channel}</p>
                    <h2 className="mt-1 truncate text-lg font-black text-ink">{detail.conversation.displayName ?? detail.conversation.contactKey}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{detail.conversation.contactKey}</p>
                  </div>
                  {selectedConversation ? (
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={selectedConversation.status} tone={selectedConversation.status === "OPEN" ? "green" : selectedConversation.status === "PENDING" ? "blue" : "gray"} />
                      <StatusPill label={`${selectedConversation.messageCount} messages`} tone="gray" />
                      {selectedConversation.followUpStatus !== "NONE" ? <StatusPill label={formatFollowUpStatus(selectedConversation.followUpStatus)} tone={followUpTone(selectedConversation.followUpStatus)} /> : null}
                      <StatusPill label={`${selectedConversation.inboundCount} inbound`} tone="green" />
                      <StatusPill label={`${selectedConversation.outboundCount} outbound`} tone="blue" />
                    </div>
                  ) : null}
                </div>

                <div className="mb-4 rounded-[18px] border border-blue-100 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black text-ink">Contact Profile</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {detail.conversation.contact
                          ? "This conversation is linked to a contact record."
                          : detail.conversation.channel === "WHATSAPP"
                            ? "No contact linked yet. Create one from this WhatsApp phone number."
                            : "Messenger conversations use PSID. Full contact linking may require a future Messenger PSID field."}
                      </p>
                    </div>
                    <Link className="text-xs font-black text-royal hover:underline" href="/contacts">
                      Open Contacts
                    </Link>
                  </div>
                  {detail.conversation.contact ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-4">
                      <ContactField label="Name" value={detail.conversation.contact.name} />
                      <ContactField label="Phone" value={detail.conversation.contact.phone ?? "-"} />
                      <ContactField label="Email" value={detail.conversation.contact.email ?? "-"} />
                      <ContactField label="Status" value={formatContactStage(detail.conversation.contact.status)} />
                    </div>
                  ) : null}
                  {detail.conversation.contact ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill label={formatContactStage(detail.conversation.contact.status)} tone="green" />
                      {parseTags(detail.conversation.contact.tags).length ? (
                        parseTags(detail.conversation.contact.tags).map((tag) => <StatusPill key={tag} label={tag} tone="blue" />)
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">No contact tags yet.</span>
                      )}
                    </div>
                  ) : null}
                  {detail.conversation.channel === "WHATSAPP" || detail.conversation.contact ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_180px_1fr_auto]">
                      <input className={`${inputClassName} w-full`} value={contactForm.name} onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))} placeholder="Contact name" />
                      <input className={`${inputClassName} w-full`} value={contactForm.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email optional" />
                      <select className={`${inputClassName} w-full`} value={contactForm.status} onChange={(event) => setContactForm((current) => ({ ...current, status: event.target.value as ContactStage }))}>
                        {contactStages.map((stage) => (
                          <option key={stage.value} value={stage.value}>{stage.label}</option>
                        ))}
                      </select>
                      <input className={`${inputClassName} w-full`} value={contactForm.tags} onChange={(event) => setContactForm((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags, comma separated" />
                      <button className={`${primaryButtonClassName} w-full whitespace-nowrap lg:w-auto`} onClick={() => void saveContactFromConversation()} disabled={contactSaving}>
                        {contactSaving ? "Saving..." : detail.conversation.contact ? "Save Contact" : "Create Contact"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[14px] border border-amber-100 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                      Messenger contact linking requires a phone number or future Messenger PSID field.
                    </div>
                  )}
                  {contactMessage ? (
                    <div className={cn("mt-3 rounded-[14px] border p-3 text-sm font-bold", contactMessage.tone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700")}>
                      {contactMessage.text}
                    </div>
                  ) : null}
                  {(detail.conversation.channel === "WHATSAPP" || detail.conversation.contact) ? (
                    <p className="mt-2 text-xs font-semibold text-slate-500">Tags example: size-42, solm8, facebook, priority</p>
                  ) : null}
                </div>

                <div className="mb-4 rounded-[18px] border border-blue-100 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black text-ink">Orders</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Manual order records only. Saving an order does not send a customer message.</p>
                    </div>
                    <Link className="text-xs font-black text-royal hover:underline" href="/orders">
                      Open Orders
                    </Link>
                  </div>
                  {orders.length ? (
                    <div className="mt-4 grid gap-2 lg:grid-cols-2">
                      {orders.slice(0, 4).map((order) => (
                        <article key={order.id} className="rounded-[14px] border border-blue-100 bg-blue-50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-ink">{order.orderNumber}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-600">{order.modelName || "No model"} {order.size ? `- ${order.size}` : ""} x {order.quantity}</p>
                            </div>
                            <p className="text-sm font-black text-royal">BDT {order.totalAmount.toLocaleString()}</p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatusPill label={order.paymentStatus} tone={order.paymentStatus === "PAID" ? "green" : order.paymentStatus === "COD" ? "blue" : "gray"} />
                            <StatusPill label={order.orderStatus} tone={order.orderStatus === "CANCELLED" ? "red" : order.orderStatus === "DELIVERED" ? "green" : "blue"} />
                            <OrderFollowUpBadge order={order} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              className={`${secondaryButtonClassName} h-9 text-xs`}
                              type="button"
                              onClick={() => void updateOrderFollowUp(order, { followUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), followUpDone: false })}
                            >
                              Follow up tomorrow
                            </button>
                            {order.followUpAt ? (
                              <button
                                className={`${secondaryButtonClassName} h-9 text-xs`}
                                type="button"
                                onClick={() => void updateOrderFollowUp(order, { followUpAt: null, followUpDone: false })}
                              >
                                Clear follow-up
                              </button>
                            ) : null}
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                            <select
                              className={`${inputClassName} h-10 w-full text-xs`}
                              value={orderTemplateById[order.id] ?? "ORDER_CONFIRMATION"}
                              onChange={(event) => setOrderTemplateById((current) => ({ ...current, [order.id]: event.target.value as OrderMessageTemplateId }))}
                            >
                              {orderMessageTemplates.map((template) => (
                                <option key={template.id} value={template.id}>{template.label}</option>
                              ))}
                            </select>
                            <button
                              className={`${secondaryButtonClassName} h-10 justify-center text-xs`}
                              type="button"
                              onClick={() => void prepareOrderMessage(order.id)}
                              disabled={preparingOrderMessageId === order.id}
                            >
                              {preparingOrderMessageId === order.id ? "Preparing..." : "Prepare Message"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-[14px] border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-slate-500">No orders linked to this conversation yet.</p>
                  )}
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <select className={`${inputClassName} w-full lg:col-span-3`} value={selectedProductId} onChange={(event) => applyProductToOrder(event.target.value)}>
                      <option value="">Select product/model</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}{product.sku ? ` - ${product.sku}` : ""} - BDT {product.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {selectedProduct ? (
                      <div className="rounded-[14px] border border-blue-100 bg-blue-50 p-3 text-xs font-semibold leading-5 text-slate-600 lg:col-span-3">
                        <p className="font-black text-ink">Selected product helper</p>
                        <p>Available sizes: {selectedProduct.availableSizes || "N/A"}</p>
                        <p>Stock note: {selectedProduct.stockNote || "No stock note"}</p>
                        <p className="mt-1 text-slate-500">Model, size, and price remain editable. Selecting a product does not reserve or reduce inventory.</p>
                      </div>
                    ) : null}
                    <input className={`${inputClassName} w-full`} value={orderForm.modelName} onChange={(event) => setOrderForm((current) => ({ ...current, modelName: event.target.value }))} placeholder="Model name" />
                    {selectedProductSizes.length ? (
                      <select className={`${inputClassName} w-full`} value={orderForm.size} onChange={(event) => setOrderForm((current) => ({ ...current, size: event.target.value }))}>
                        <option value="">Select size</option>
                        {selectedProductSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                      </select>
                    ) : (
                      <input className={`${inputClassName} w-full`} value={orderForm.size} onChange={(event) => setOrderForm((current) => ({ ...current, size: event.target.value }))} placeholder="Size" />
                    )}
                    <input className={`${inputClassName} w-full`} type="number" min="1" value={orderForm.quantity} onChange={(event) => setOrderForm((current) => ({ ...current, quantity: event.target.value }))} placeholder="Quantity" />
                    <input className={`${inputClassName} w-full`} type="number" min="0" value={orderForm.unitPrice} onChange={(event) => setOrderForm((current) => ({ ...current, unitPrice: event.target.value }))} placeholder="Unit price" />
                    <input className={`${inputClassName} w-full`} type="number" min="0" value={orderForm.deliveryCharge} onChange={(event) => setOrderForm((current) => ({ ...current, deliveryCharge: event.target.value }))} placeholder="Delivery charge" />
                    <input className={`${inputClassName} w-full`} value={orderForm.customerName} onChange={(event) => setOrderForm((current) => ({ ...current, customerName: event.target.value }))} placeholder="Customer name" />
                    <input className={`${inputClassName} w-full`} value={orderForm.customerPhone} onChange={(event) => setOrderForm((current) => ({ ...current, customerPhone: event.target.value }))} placeholder="Customer phone" />
                    <select className={`${inputClassName} w-full`} value={orderForm.paymentStatus} onChange={(event) => setOrderForm((current) => ({ ...current, paymentStatus: event.target.value }))}>
                      {["UNPAID", "PARTIAL", "PAID", "COD"].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select className={`${inputClassName} w-full`} value={orderForm.orderStatus} onChange={(event) => setOrderForm((current) => ({ ...current, orderStatus: event.target.value }))}>
                      {["DRAFT", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                  <textarea
                    className="mt-3 min-h-20 w-full rounded-[14px] border border-blue-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100"
                    value={orderForm.deliveryAddress}
                    onChange={(event) => setOrderForm((current) => ({ ...current, deliveryAddress: event.target.value }))}
                    placeholder="Delivery address"
                  />
                  <textarea
                    className="mt-3 min-h-20 w-full rounded-[14px] border border-blue-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100"
                    value={orderForm.notes}
                    onChange={(event) => setOrderForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Order notes"
                  />
                  {orderMessage ? (
                    <div className={cn("mt-3 rounded-[14px] border p-3 text-sm font-bold", orderMessage.tone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700")}>
                      {orderMessage.text}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold text-slate-500">Total is calculated server-side as quantity x unit price + delivery charge.</p>
                    <button className={`${primaryButtonClassName} w-full sm:w-auto`} onClick={() => void saveOrderFromConversation()} disabled={orderSaving}>
                      {orderSaving ? "Saving..." : "Save Order"}
                    </button>
                  </div>
                </div>

                <div className="mb-4 rounded-[18px] border border-blue-100 bg-white p-4">
                  <div className="grid gap-3 lg:grid-cols-[180px_1fr_auto]">
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase text-slate-500">Status</span>
                      <select className={`${inputClassName} w-full`} value={draftState.status} onChange={(event) => setDraftState((current) => ({ ...current, status: event.target.value as ConversationStatus }))}>
                        <option value="OPEN">Open</option>
                        <option value="PENDING">Pending</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase text-slate-500">Assignee</span>
                      <select className={`${inputClassName} w-full`} value={draftState.assignedToId} onChange={(event) => setDraftState((current) => ({ ...current, assignedToId: event.target.value }))}>
                        <option value="UNASSIGNED">Unassigned</option>
                        {assignees.map((user) => (
                          <option key={user.id} value={user.id}>{user.name} - {user.role}</option>
                        ))}
                      </select>
                    </label>
                    <button className={`${primaryButtonClassName} self-end`} onClick={() => void saveConversationState()} disabled={stateSaving}>
                      {stateSaving ? "Saving..." : "Save State"}
                    </button>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Open means needs attention, Pending means waiting or follow-up, and Closed means handled.
                  </p>
                  {stateMessage ? (
                    <div className={cn("mt-3 rounded-[14px] border p-3 text-sm font-bold", stateMessage.tone === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700")}>
                      {stateMessage.text}
                    </div>
                  ) : null}
                </div>

                <div className="mb-4 rounded-[18px] border border-blue-100 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black text-ink">Internal CRM</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Internal notes are never sent to the customer.</p>
                    </div>
                    <StatusPill label={formatFollowUpStatus(detail.conversation.followUpStatus)} tone={followUpTone(detail.conversation.followUpStatus)} />
                  </div>
                  <textarea
                    className="mt-4 min-h-24 w-full rounded-[14px] border border-blue-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100"
                    value={internalDraft.internalNote}
                    maxLength={2000}
                    onChange={(event) => setInternalDraft((current) => ({ ...current, internalNote: event.target.value }))}
                    placeholder="Add an internal note for the team"
                  />
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase text-slate-500">Follow-up</span>
                      <input
                        className={`${inputClassName} w-full`}
                        type="datetime-local"
                        value={internalDraft.followUpAt}
                        onChange={(event) => setInternalDraft((current) => ({ ...current, followUpAt: event.target.value, followUpDone: false }))}
                      />
                    </label>
                    <label className="flex h-11 items-center gap-2 self-end rounded-[14px] border border-blue-100 bg-blue-50 px-3 text-sm font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={internalDraft.followUpDone}
                        onChange={(event) => setInternalDraft((current) => ({ ...current, followUpDone: event.target.checked }))}
                      />
                      Done
                    </label>
                    <div className="flex flex-col gap-2 self-end sm:flex-row">
                      {internalDraft.followUpAt ? (
                        <button className={secondaryButtonClassName} type="button" onClick={() => void saveConversationState({ clearFollowUp: true })} disabled={stateSaving}>
                          Clear Follow-up
                        </button>
                      ) : null}
                      <button className={primaryButtonClassName} type="button" onClick={() => void saveConversationState()} disabled={stateSaving}>
                        {stateSaving ? "Saving..." : "Save Internal"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Follow-up status: Due means now or overdue, Upcoming means scheduled later, Done means completed, and None means no reminder.
                  </p>
                </div>

                <div className="soft-scrollbar flex-1 space-y-3 overflow-y-auto rounded-[18px] border border-blue-100 bg-slate-50 p-3 sm:p-4">
                  {detail.messages.length ? (
                    detail.messages.map((message) => (
                      <div key={message.id} className={cn("flex", message.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[94%] break-words rounded-[18px] px-3 py-3 text-sm font-semibold shadow-sm sm:max-w-[82%] sm:px-4",
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
                            <p className={cn("mt-1 break-all text-[11px]", message.direction === "OUTBOUND" ? "text-blue-100" : "text-slate-400")}>
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

                <div className="mt-4 rounded-[18px] border border-blue-100 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black text-ink">Reply from Inbox</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {detail.conversation.channel === "WHATSAPP"
                          ? "WhatsApp replies use the customer phone number from this conversation."
                          : "Messenger replies use the Facebook PSID from this conversation."}
                      </p>
                    </div>
                    <Link className="text-xs font-black text-royal hover:underline" href="/message-logs">
                      Verify in Message Logs
                    </Link>
                  </div>
                  <textarea
                    className="mt-4 min-h-24 w-full rounded-[14px] border border-blue-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100"
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Write a reply"
                  />
                  <div className="mt-3 rounded-[14px] border border-blue-100 bg-blue-50 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-black text-royal">
                        <Paperclip className="h-4 w-4" />
                        Attach image or PDF
                        <input
                          ref={replyFileInputRef}
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(event) => selectReplyAttachment(event.target.files?.[0] ?? null)}
                        />
                      </label>
                      <span className="text-xs font-semibold text-slate-500">Phase 1 supports image and PDF only.</span>
                    </div>
                    {replyAttachment ? (
                      <div className="mt-3 flex flex-col gap-2 rounded-[12px] bg-white px-3 py-2 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0 break-all">{replyAttachment.name} ({formatBytes(replyAttachment.size)})</span>
                        <button className="inline-flex items-center gap-1 text-xs font-black text-rose-600" type="button" onClick={clearReplyAttachment} disabled={replySending}>
                          <XCircle className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {replyStatus ? (
                    <div
                      className={cn(
                        "mt-3 rounded-[14px] border p-3 text-sm font-bold",
                        replyStatus === "sent_successfully"
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-amber-100 bg-amber-50 text-amber-700"
                      )}
                    >
                      <p>{replyError || replyStatusText[replyStatus]}</p>
                      {replyProviderError ? (
                        <p className="mt-1 text-xs font-semibold">{replyProviderError}</p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold text-slate-500">
                      Success is logged only after Meta accepts the message. Failed provider attempts are logged as FAILED.
                    </p>
                    <button className={`${primaryButtonClassName} w-full sm:w-auto`} onClick={() => void sendReply()} disabled={replySending || (!replyBody.trim() && !replyAttachment)}>
                      <Send className="h-4 w-4" />
                      {replySending ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
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

function OrderFollowUpBadge({ order }: { order: Order }) {
  if (order.followUpDone) {
    return <StatusPill label="Follow-up done" tone="green" />;
  }

  if (!order.followUpAt) {
    return null;
  }

  const due = new Date(order.followUpAt).getTime() <= Date.now();
  return <StatusPill label={`${due ? "Due" : "Upcoming"} ${formatDate(order.followUpAt)}`} tone={due ? "red" : "blue"} />;
}

function ContactField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-blue-100 bg-blue-50 px-3 py-2">
      <p className="text-[11px] font-black uppercase text-royal">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

function formatContactStage(value: string | null | undefined) {
  return getContactStatusLabel(value);
}

function formatFollowUpStatus(value: FollowUpStatus) {
  const labels: Record<FollowUpStatus, string> = {
    NONE: "None",
    DUE: "Due",
    UPCOMING: "Upcoming",
    DONE: "Done"
  };

  return labels[value];
}

function followUpTone(value: FollowUpStatus): "blue" | "green" | "gray" | "purple" | "red" {
  if (value === "DUE") return "red";
  if (value === "UPCOMING") return "blue";
  if (value === "DONE") return "green";
  return "gray";
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseChannelFilter(value: string | null): ChannelFilter {
  return value === "WHATSAPP" || value === "MESSENGER" ? value : "ALL";
}

function parseStatusFilter(value: string | null): StatusFilter {
  return value === "OPEN" || value === "PENDING" || value === "CLOSED" ? value : "ALL";
}

function parseFollowUpFilter(value: string | null): FollowUpFilter {
  return value === "NONE" || value === "DUE" || value === "UPCOMING" || value === "DONE" ? value : "ALL";
}

function getInitialFilters() {
  if (typeof window === "undefined") {
    return {
      channel: "ALL" as ChannelFilter,
      status: "ALL" as StatusFilter,
      followUp: "ALL" as FollowUpFilter,
      assignedTo: "ALL",
      contactStatus: "ALL",
      contactTag: ""
    };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    channel: parseChannelFilter(params.get("channel")),
    status: parseStatusFilter(params.get("status")),
    followUp: parseFollowUpFilter(params.get("followUp")),
    assignedTo: params.get("assignedTo")?.trim() || "ALL",
    contactStatus: params.get("contactStatus") ? normalizeContactStatus(params.get("contactStatus")) : "ALL",
    contactTag: params.get("contactTag")?.trim() || ""
  };
}

function formatProviderError(providerError: ReplyResponse["providerError"]) {
  if (!providerError) return null;

  const parts = [
    providerError.message,
    providerError.type ? `type ${providerError.type}` : null,
    providerError.code !== undefined ? `code ${providerError.code}` : null,
    providerError.subcode !== undefined ? `subcode ${providerError.subcode}` : null,
    providerError.fbtraceId ? `fbtrace ${providerError.fbtraceId}` : null
  ].filter(Boolean);

  return parts.length ? parts.join("; ") : null;
}

function buildAttachmentReplyRequest({
  channel,
  contactKey,
  body,
  attachment
}: {
  channel: "WHATSAPP" | "MESSENGER";
  contactKey: string;
  body: string;
  attachment: File;
}): RequestInit {
  const formData = new FormData();
  formData.append("channel", channel);
  formData.append("contactKey", contactKey);
  formData.append("body", body);
  formData.append("attachment", attachment);

  return {
    method: "POST",
    body: formData
  };
}

function validateReplyAttachment(file: File) {
  if (!allowedReplyAttachmentTypes.includes(file.type)) {
    return "Phase 1 supports image and PDF attachments only.";
  }

  if (file.type === "application/pdf" && file.size > pdfReplyMaxBytes) {
    return "PDF attachments must be 10 MB or smaller.";
  }

  if (file.type !== "application/pdf" && file.size > imageReplyMaxBytes) {
    return "Image attachments must be 5 MB or smaller.";
  }

  return null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
