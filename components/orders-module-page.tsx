"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clipboard, ClipboardList, Clock, CreditCard, RefreshCw, Search, ShoppingBag } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { getOrderMessageTemplates, type OrderMessageTemplateId } from "@/lib/order-message-templates";
import { ORDER_STATUSES, PAYMENT_STATUSES, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/order-status";
import { AppShell } from "./app-shell";
import { DataState, Toast, formatDate, inputClassName, primaryButtonClassName, secondaryButtonClassName, useApiData, useToast } from "./saas-page-utils";

type Order = {
  id: string;
  orderNumber: string;
  modelName: string;
  size: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  followUpAt: string | null;
  followUpDone: boolean;
  customerName: string;
  customerPhone: string;
  updatedAt: string;
  contact: { id: string; name: string; phone: string } | null;
};

type OrdersResponse = {
  orders: Order[];
};

type OrderMessagePreviewResponse = {
  message: string;
  templateLabel: string;
};

const orderMessageTemplates = getOrderMessageTemplates();

export function OrdersModulePage() {
  const { toast, showToast } = useToast();
  const initialFilters = getInitialOrderFilters();
  const [orderStatus, setOrderStatus] = useState(initialFilters.status);
  const [paymentStatus, setPaymentStatus] = useState(initialFilters.paymentStatus);
  const [followUp, setFollowUp] = useState(initialFilters.followUp);
  const [sort, setSort] = useState(initialFilters.sort);
  const [search, setSearch] = useState(initialFilters.search);
  const [quickDrafts, setQuickDrafts] = useState<Record<string, { orderStatus: string; paymentStatus: string; followUpAt: string; followUpDone: boolean }>>({});
  const [templateByOrderId, setTemplateByOrderId] = useState<Record<string, OrderMessageTemplateId>>({});
  const [preview, setPreview] = useState<{ orderId: string; orderNumber: string; templateLabel: string; message: string } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "200" });
    if (orderStatus !== "ALL") params.set("status", orderStatus);
    if (paymentStatus !== "ALL") params.set("paymentStatus", paymentStatus);
    if (followUp !== "ALL") params.set("followUp", followUp);
    if (sort !== "updated") params.set("sort", sort);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [orderStatus, paymentStatus, followUp, sort, search]);
  const orders = useApiData<OrdersResponse>(`/api/orders?${query}`);

  async function saveQuickUpdate(order: Order) {
    const draft = getQuickDraft(order, quickDrafts[order.id]);

    try {
      await apiRequest<{ order: Order }>(`/api/orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          orderStatus: draft.orderStatus,
          paymentStatus: draft.paymentStatus,
          followUpAt: draft.followUpAt || null,
          followUpDone: draft.followUpDone
        })
      });
      showToast("Order quick update saved. No customer message was sent.");
      setQuickDrafts((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
      orders.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function clearFollowUp(order: Order) {
    try {
      await apiRequest<{ order: Order }>(`/api/orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({ followUpAt: null, followUpDone: false })
      });
      showToast("Order follow-up cleared.");
      setQuickDrafts((current) => ({ ...current, [order.id]: { ...getQuickDraft(order, current[order.id]), followUpAt: "", followUpDone: false } }));
      orders.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function generateMessage(order: Order, copyToClipboard = false) {
    const templateId = templateByOrderId[order.id] ?? "ORDER_CONFIRMATION";
    setPreviewLoadingId(order.id);

    try {
      const result = await apiRequest<OrderMessagePreviewResponse>(`/api/orders/${order.id}/message-preview?templateId=${encodeURIComponent(templateId)}`);
      setPreview({
        orderId: order.id,
        orderNumber: order.orderNumber,
        templateLabel: result.templateLabel,
        message: result.message
      });

      if (copyToClipboard && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(result.message);
        showToast("Order message copied. Review before sending.");
      } else {
        showToast("Order message preview ready.");
      }
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setPreviewLoadingId(null);
    }
  }

  async function copyPreviewMessage() {
    if (!preview) return;

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        showToast("Copy is not available in this browser. Use the preview text.", "error");
        return;
      }

      await navigator.clipboard.writeText(preview.message);
      showToast("Order message copied. Review before sending.");
    } catch {
      showToast("Copy failed. Use the preview text.", "error");
    }
  }

  const items = orders.data?.orders ?? [];

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <ClipboardList className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Order Tracking</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Orders</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manual order records linked to contacts and inbox conversations. No payment gateway, courier, inventory, or automatic customer messages are active.
              </p>
            </div>
          </div>
          <button className={primaryButtonClassName} onClick={orders.reload}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryLink href="/orders?status=DRAFT" icon={ShoppingBag} label="Draft" />
          <SummaryLink href="/orders?status=CONFIRMED" icon={CheckCircle2} label="Confirmed" />
          <SummaryLink href="/orders?status=PACKED" icon={ShoppingBag} label="Packed" />
          <SummaryLink href="/orders?status=SHIPPED" icon={ClipboardList} label="Shipped" />
          <SummaryLink href="/orders?status=DELIVERED" icon={CheckCircle2} label="Delivered" />
          <SummaryLink href="/orders?status=CANCELLED" icon={AlertTriangle} label="Cancelled" />
          <SummaryLink href="/orders?followUp=DUE" icon={Clock} label="Due follow-ups" />
          <SummaryLink href="/orders?paymentStatus=UNPAID" icon={CreditCard} label="Unpaid/COD" />
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_180px_180px_180px_1fr]">
          <select className={inputClassName} value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)}>
            <option value="ALL">All order statuses</option>
            {ORDER_STATUSES.map((status) => <option key={status} value={status}>{getOrderStatusLabel(status)}</option>)}
          </select>
          <select className={inputClassName} value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
            <option value="ALL">All payment statuses</option>
            {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{getPaymentStatusLabel(status)}</option>)}
          </select>
          <select className={inputClassName} value={followUp} onChange={(event) => setFollowUp(event.target.value)}>
            <option value="ALL">All follow-ups</option>
            <option value="DUE">Due</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="DONE">Done</option>
            <option value="NONE">None</option>
          </select>
          <select className={inputClassName} value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="updated">Recently updated</option>
            <option value="newest">Newest created</option>
            <option value="followup">Follow-up first</option>
            <option value="amount">Highest amount</option>
          </select>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClassName} w-full pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, model, phone" />
          </label>
        </div>
      </section>

      {preview ? (
        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-royal">Message Preview</p>
              <h2 className="mt-1 text-lg font-black text-ink">{preview.templateLabel} - {preview.orderNumber}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Review this generated order message before sending manually from Inbox or the customer channel.</p>
            </div>
            <button
              className={secondaryButtonClassName}
              type="button"
              onClick={() => void copyPreviewMessage()}
            >
              <Clipboard className="h-4 w-4" />
              Copy
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded-[18px] border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-700">{preview.message}</pre>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
        <DataState loading={orders.loading} error={orders.error} empty={!items.length} emptyText="No orders match this view. Create an order from an Inbox conversation.">
          <div className="grid gap-3 p-4 lg:hidden">
            {items.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                quickDraft={quickDrafts[order.id]}
                onQuickDraftChange={(draft) => setQuickDrafts((current) => ({ ...current, [order.id]: draft }))}
                onSaveQuickUpdate={() => void saveQuickUpdate(order)}
                onClearFollowUp={() => void clearFollowUp(order)}
                templateId={templateByOrderId[order.id] ?? "ORDER_CONFIRMATION"}
                onTemplateChange={(templateId) => setTemplateByOrderId((current) => ({ ...current, [order.id]: templateId }))}
                onGenerate={(copy) => void generateMessage(order, copy)}
                messageLoading={previewLoadingId === order.id}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[1500px] w-full text-left">
              <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500">
                <tr>
                  {["Order", "Customer", "Model", "Size", "Qty", "Total", "Quick Update", "Follow-up", "Message", "Updated"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {items.map((order) => {
                  const quickDraft = getQuickDraft(order, quickDrafts[order.id]);
                  return (
                  <tr key={order.id} className="text-sm font-semibold text-slate-600">
                    <td className="px-4 py-4">
                      <p className="font-black text-ink">{order.orderNumber}</p>
                      <FollowUpBadge order={order} />
                    </td>
                    <td className="px-4 py-4">{order.customerName || order.contact?.name || order.customerPhone || "-"}</td>
                    <td className="px-4 py-4">{order.modelName || "-"}</td>
                    <td className="px-4 py-4">{order.size || "-"}</td>
                    <td className="px-4 py-4">{order.quantity}</td>
                    <td className="px-4 py-4">BDT {order.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <div className="grid min-w-44 gap-2">
                        <StatusSelect value={quickDraft.paymentStatus} options={PAYMENT_STATUSES} label={getPaymentStatusLabel} onChange={(value) => setQuickDrafts((current) => ({ ...current, [order.id]: { ...quickDraft, paymentStatus: value } }))} />
                        <StatusSelect value={quickDraft.orderStatus} options={ORDER_STATUSES} label={getOrderStatusLabel} onChange={(value) => setQuickDrafts((current) => ({ ...current, [order.id]: { ...quickDraft, orderStatus: value } }))} />
                        <button className={`${secondaryButtonClassName} h-9 px-3 text-xs`} type="button" onClick={() => void saveQuickUpdate(order)}>
                          Save quick update
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid min-w-52 gap-2">
                        <input
                          className={`${inputClassName} h-10 w-full text-xs`}
                          type="datetime-local"
                          value={quickDraft.followUpAt}
                          onChange={(event) => setQuickDrafts((current) => ({ ...current, [order.id]: { ...quickDraft, followUpAt: event.target.value, followUpDone: false } }))}
                        />
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <input
                            type="checkbox"
                            checked={quickDraft.followUpDone}
                            onChange={(event) => setQuickDrafts((current) => ({ ...current, [order.id]: { ...quickDraft, followUpDone: event.target.checked } }))}
                          />
                          Done
                        </label>
                        <button className={`${secondaryButtonClassName} h-9 px-3 text-xs`} type="button" onClick={() => void clearFollowUp(order)}>
                          Clear
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid min-w-48 gap-2">
                        <select
                          className={`${inputClassName} h-10 w-full text-xs`}
                          value={templateByOrderId[order.id] ?? "ORDER_CONFIRMATION"}
                          onChange={(event) => setTemplateByOrderId((current) => ({ ...current, [order.id]: event.target.value as OrderMessageTemplateId }))}
                        >
                          {orderMessageTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button className={`${secondaryButtonClassName} h-9 px-3 text-xs`} type="button" onClick={() => void generateMessage(order)} disabled={previewLoadingId === order.id}>
                            {previewLoadingId === order.id ? "Loading..." : "Preview"}
                          </button>
                          <button className={`${secondaryButtonClassName} h-9 px-3 text-xs`} type="button" onClick={() => void generateMessage(order, true)} disabled={previewLoadingId === order.id}>
                            Copy
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{formatDate(order.updatedAt)}</td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </DataState>
      </section>
      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function OrderCard({
  order,
  quickDraft,
  onQuickDraftChange,
  onSaveQuickUpdate,
  onClearFollowUp,
  templateId,
  onTemplateChange,
  onGenerate,
  messageLoading
}: {
  order: Order;
  quickDraft?: { orderStatus: string; paymentStatus: string; followUpAt: string; followUpDone: boolean };
  onQuickDraftChange: (draft: { orderStatus: string; paymentStatus: string; followUpAt: string; followUpDone: boolean }) => void;
  onSaveQuickUpdate: () => void;
  onClearFollowUp: () => void;
  templateId: OrderMessageTemplateId;
  onTemplateChange: (templateId: OrderMessageTemplateId) => void;
  onGenerate: (copy: boolean) => void;
  messageLoading: boolean;
}) {
  const draft = getQuickDraft(order, quickDraft);

  return (
    <article className="rounded-[18px] border border-blue-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-ink">{order.orderNumber}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">{order.customerName || order.customerPhone || "No customer name"}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{order.customerPhone || order.contact?.phone || "No phone"}</p>
        </div>
        <p className="text-sm font-black text-royal">BDT {order.totalAmount.toLocaleString()}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600">{order.modelName || "No model"} {order.size ? `- ${order.size}` : ""} x {order.quantity}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusChip label={getPaymentStatusLabel(order.paymentStatus)} tone={order.paymentStatus === "PAID" ? "green" : order.paymentStatus === "UNPAID" ? "red" : "blue"} />
        <StatusChip label={getOrderStatusLabel(order.orderStatus)} tone={order.orderStatus === "CANCELLED" ? "red" : order.orderStatus === "DELIVERED" ? "green" : "blue"} />
        <FollowUpBadge order={order} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <StatusSelect value={draft.paymentStatus} options={PAYMENT_STATUSES} label={getPaymentStatusLabel} onChange={(value) => onQuickDraftChange({ ...draft, paymentStatus: value })} />
        <StatusSelect value={draft.orderStatus} options={ORDER_STATUSES} label={getOrderStatusLabel} onChange={(value) => onQuickDraftChange({ ...draft, orderStatus: value })} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className={`${inputClassName} h-10 w-full text-xs`}
          type="datetime-local"
          value={draft.followUpAt}
          onChange={(event) => onQuickDraftChange({ ...draft, followUpAt: event.target.value, followUpDone: false })}
        />
        <label className="flex h-10 items-center gap-2 rounded-[14px] border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-slate-600">
          <input type="checkbox" checked={draft.followUpDone} onChange={(event) => onQuickDraftChange({ ...draft, followUpDone: event.target.checked })} />
          Done
        </label>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button className={`${secondaryButtonClassName} justify-center text-xs`} type="button" onClick={onSaveQuickUpdate}>
          Save quick update
        </button>
        <button className={`${secondaryButtonClassName} justify-center text-xs`} type="button" onClick={onClearFollowUp}>
          Clear follow-up
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        <select className={`${inputClassName} h-10 w-full text-xs`} value={templateId} onChange={(event) => onTemplateChange(event.target.value as OrderMessageTemplateId)}>
          {orderMessageTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
        </select>
        <div className="grid gap-2 sm:grid-cols-2">
          <button className={`${secondaryButtonClassName} justify-center text-xs`} type="button" onClick={() => onGenerate(false)} disabled={messageLoading}>
            {messageLoading ? "Loading..." : "Preview Message"}
          </button>
          <button className={`${secondaryButtonClassName} justify-center text-xs`} type="button" onClick={() => onGenerate(true)} disabled={messageLoading}>
            Copy Message
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">Updated {formatDate(order.updatedAt)}</p>
    </article>
  );
}

function StatusSelect<T extends string>({ value, options, label, onChange }: { value: string; options: readonly T[]; label: (value: string) => string; onChange: (value: T) => void }) {
  return (
    <select className={`${inputClassName} h-10 w-full text-xs`} value={value} onChange={(event) => onChange(event.target.value as T)}>
      {options.map((option) => <option key={option} value={option}>{label(option)}</option>)}
    </select>
  );
}

function getInitialOrderFilters() {
  if (typeof window === "undefined") {
    return { status: "ALL", paymentStatus: "ALL", followUp: "ALL", sort: "updated", search: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    status: params.get("status")?.trim() || "ALL",
    paymentStatus: params.get("paymentStatus")?.trim() || "ALL",
    followUp: params.get("followUp")?.trim() || "ALL",
    sort: params.get("sort")?.trim() || "updated",
    search: params.get("search")?.trim() || ""
  };
}

function SummaryLink({ href, icon: Icon, label }: { href: string; icon: typeof ShoppingBag; label: string }) {
  return (
    <Link className="flex items-center gap-3 rounded-[18px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-ink transition hover:border-royal hover:bg-white" href={href}>
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-white text-royal ring-1 ring-blue-100">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}

function getQuickDraft(order: Order, draft?: { orderStatus: string; paymentStatus: string; followUpAt: string; followUpDone: boolean }) {
  return draft ?? {
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    followUpAt: toDateTimeLocal(order.followUpAt),
    followUpDone: order.followUpDone
  };
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function FollowUpBadge({ order }: { order: Order }) {
  const status = getFollowUpStatus(order);
  if (status === "NONE") return null;

  const label = status === "DUE"
    ? `Due ${formatDate(order.followUpAt ?? "")}`
    : status === "UPCOMING"
      ? `Upcoming ${formatDate(order.followUpAt ?? "")}`
      : "Follow-up done";

  return <StatusChip label={label} tone={status === "DUE" ? "red" : status === "DONE" ? "green" : "blue"} />;
}

function getFollowUpStatus(order: Order) {
  if (order.followUpDone) return "DONE";
  if (!order.followUpAt) return "NONE";
  return new Date(order.followUpAt).getTime() <= Date.now() ? "DUE" : "UPCOMING";
}

function StatusChip({ label, tone }: { label: string; tone: "blue" | "green" | "red" }) {
  return (
    <span className={[
      "rounded-full px-2.5 py-1 text-[11px] font-black uppercase ring-1",
      tone === "blue" ? "bg-blue-50 text-royal ring-blue-100" : "",
      tone === "green" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "",
      tone === "red" ? "bg-rose-50 text-rose-700 ring-rose-100" : ""
    ].join(" ")}>
      {label}
    </span>
  );
}
