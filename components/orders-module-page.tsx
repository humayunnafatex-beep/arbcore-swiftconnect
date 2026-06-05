"use client";

import { useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { ORDER_STATUSES, PAYMENT_STATUSES, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/order-status";
import { AppShell } from "./app-shell";
import { DataState, Toast, formatDate, inputClassName, primaryButtonClassName, useApiData, useToast } from "./saas-page-utils";

type Order = {
  id: string;
  orderNumber: string;
  modelName: string;
  size: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  customerName: string;
  customerPhone: string;
  updatedAt: string;
  contact: { id: string; name: string; phone: string } | null;
};

type OrdersResponse = {
  orders: Order[];
};

export function OrdersModulePage() {
  const { toast, showToast } = useToast();
  const initialFilters = getInitialOrderFilters();
  const [orderStatus, setOrderStatus] = useState(initialFilters.status);
  const [paymentStatus, setPaymentStatus] = useState(initialFilters.paymentStatus);
  const [search, setSearch] = useState(initialFilters.search);
  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "200" });
    if (orderStatus !== "ALL") params.set("status", orderStatus);
    if (paymentStatus !== "ALL") params.set("paymentStatus", paymentStatus);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [orderStatus, paymentStatus, search]);
  const orders = useApiData<OrdersResponse>(`/api/orders?${query}`);

  async function updateOrder(order: Order, patch: Partial<Pick<Order, "orderStatus" | "paymentStatus">>) {
    try {
      await apiRequest<{ order: Order }>(`/api/orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });
      showToast("Order updated.");
      orders.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
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
        <div className="grid gap-3 md:grid-cols-[180px_180px_1fr]">
          <select className={inputClassName} value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)}>
            <option value="ALL">All order statuses</option>
            {ORDER_STATUSES.map((status) => <option key={status} value={status}>{getOrderStatusLabel(status)}</option>)}
          </select>
          <select className={inputClassName} value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>
            <option value="ALL">All payment statuses</option>
            {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{getPaymentStatusLabel(status)}</option>)}
          </select>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClassName} w-full pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, model, phone" />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
        <DataState loading={orders.loading} error={orders.error} empty={!items.length} emptyText="No orders match this view. Create an order from an Inbox conversation.">
          <div className="grid gap-3 p-4 lg:hidden">
            {items.map((order) => <OrderCard key={order.id} order={order} onUpdate={updateOrder} />)}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500">
                <tr>
                  {["Order", "Customer", "Model", "Size", "Qty", "Total", "Payment", "Status", "Updated"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {items.map((order) => (
                  <tr key={order.id} className="text-sm font-semibold text-slate-600">
                    <td className="px-4 py-4 font-black text-ink">{order.orderNumber}</td>
                    <td className="px-4 py-4">{order.customerName || order.contact?.name || order.customerPhone || "-"}</td>
                    <td className="px-4 py-4">{order.modelName || "-"}</td>
                    <td className="px-4 py-4">{order.size || "-"}</td>
                    <td className="px-4 py-4">{order.quantity}</td>
                    <td className="px-4 py-4">BDT {order.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-4"><StatusSelect value={order.paymentStatus} options={PAYMENT_STATUSES} label={getPaymentStatusLabel} onChange={(value) => void updateOrder(order, { paymentStatus: value })} /></td>
                    <td className="px-4 py-4"><StatusSelect value={order.orderStatus} options={ORDER_STATUSES} label={getOrderStatusLabel} onChange={(value) => void updateOrder(order, { orderStatus: value })} /></td>
                    <td className="px-4 py-4">{formatDate(order.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </section>
      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: (order: Order, patch: Partial<Pick<Order, "orderStatus" | "paymentStatus">>) => Promise<void> }) {
  return (
    <article className="rounded-[18px] border border-blue-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-ink">{order.orderNumber}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">{order.customerName || order.customerPhone || "No customer name"}</p>
        </div>
        <p className="text-sm font-black text-royal">BDT {order.totalAmount.toLocaleString()}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600">{order.modelName || "No model"} {order.size ? `- ${order.size}` : ""} x {order.quantity}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <StatusSelect value={order.paymentStatus} options={PAYMENT_STATUSES} label={getPaymentStatusLabel} onChange={(value) => void onUpdate(order, { paymentStatus: value })} />
        <StatusSelect value={order.orderStatus} options={ORDER_STATUSES} label={getOrderStatusLabel} onChange={(value) => void onUpdate(order, { orderStatus: value })} />
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
    return { status: "ALL", paymentStatus: "ALL", search: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    status: params.get("status")?.trim() || "ALL",
    paymentStatus: params.get("paymentStatus")?.trim() || "ALL",
    search: params.get("search")?.trim() || ""
  };
}
