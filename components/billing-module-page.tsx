"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { CreditCard, History, Loader2, RefreshCw, Save, ShieldAlert } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import { DataState, Toast, formatDate, inputClassName, primaryButtonClassName, secondaryButtonClassName, textareaClassName, useApiData, useToast } from "./saas-page-utils";

type Subscription = {
  id: string | null;
  companyId: string;
  plan: string;
  status: string;
  billingMode: string;
  startedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  notes: string;
};

type SubscriptionResponse = {
  subscription: Subscription;
  created: boolean;
};

type PaymentRecord = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionRef: string;
  paidAt: string | null;
  notes: string;
  createdAt: string;
};

type PaymentsResponse = {
  payments: PaymentRecord[];
};

const plans = ["ENTERPRISE_BETA", "STARTER", "BUSINESS", "AGENCY", "ENTERPRISE"];
const subscriptionStatuses = ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED"];
const methods = ["MANUAL", "CASH", "BANK", "BKASH", "NAGAD", "SSLCOMMERZ_FUTURE", "STRIPE_FUTURE"];
const paymentStatuses = ["PENDING", "CONFIRMED", "FAILED", "REFUNDED"];

function dateInputValue(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function BillingModulePage() {
  const subscriptionRequest = useApiData<SubscriptionResponse>("/api/billing/subscription");
  const paymentsRequest = useApiData<PaymentsResponse>("/api/billing/payments");
  const { toast, showToast } = useToast();
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: "ENTERPRISE_BETA",
    status: "ACTIVE",
    currentPeriodStart: "",
    currentPeriodEnd: "",
    notes: ""
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    currency: "BDT",
    method: "MANUAL",
    status: "PENDING",
    transactionRef: "",
    paidAt: "",
    notes: ""
  });

  useEffect(() => {
    const subscription = subscriptionRequest.data?.subscription;
    if (!subscription) return;

    setSubscriptionForm({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: dateInputValue(subscription.currentPeriodStart),
      currentPeriodEnd: dateInputValue(subscription.currentPeriodEnd),
      notes: subscription.notes || ""
    });
  }, [subscriptionRequest.data]);

  function refreshAll() {
    subscriptionRequest.reload();
    paymentsRequest.reload();
  }

  async function saveSubscription() {
    setSavingSubscription(true);
    try {
      await apiRequest<SubscriptionResponse>("/api/billing/subscription", {
        method: "POST",
        body: JSON.stringify({
          ...subscriptionForm,
          currentPeriodStart: subscriptionForm.currentPeriodStart || null,
          currentPeriodEnd: subscriptionForm.currentPeriodEnd || null
        })
      });
      showToast("Manual subscription updated.");
      subscriptionRequest.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSavingSubscription(false);
    }
  }

  async function addPayment() {
    setAddingPayment(true);
    try {
      await apiRequest<{ payment: PaymentRecord }>("/api/billing/payments", {
        method: "POST",
        body: JSON.stringify({
          ...paymentForm,
          amount: Number(paymentForm.amount),
          paidAt: paymentForm.paidAt || null
        })
      });
      showToast("Manual payment record added.");
      setPaymentForm({
        amount: "",
        currency: "BDT",
        method: "MANUAL",
        status: "PENDING",
        transactionRef: "",
        paidAt: "",
        notes: ""
      });
      paymentsRequest.reload();
      subscriptionRequest.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setAddingPayment(false);
    }
  }

  const subscription = subscriptionRequest.data?.subscription;
  const payments = paymentsRequest.data?.payments ?? [];

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <CreditCard className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Manual Billing</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Billing</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Track paid beta subscriptions and manual payment records without gateway automation or card data.</p>
            </div>
          </div>
          <button className={secondaryButtonClassName} onClick={refreshAll} disabled={subscriptionRequest.loading || paymentsRequest.loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[22px] border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>This is manual beta payment tracking. Gateway automation is not active yet. Do not store card data, and do not mark payment confirmed unless an admin has verified it manually.</p>
        </div>
      </section>

      <DataState loading={subscriptionRequest.loading} error={subscriptionRequest.error} empty={!subscription} emptyText="No subscription status is available yet.">
        {subscription ? (
          <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
            <article className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
              <p className="text-xs font-black uppercase text-royal">Billing Overview</p>
              <h2 className="mt-2 text-2xl font-black text-ink">{subscription.plan.replace(/_/g, " ")}</h2>
              <div className="mt-5 grid gap-3">
                <Info label="Subscription status" value={subscription.status} />
                <Info label="Billing mode" value={subscription.billingMode} />
                <Info label="Current period" value={`${dateInputValue(subscription.currentPeriodStart) || "-"} to ${dateInputValue(subscription.currentPeriodEnd) || "-"}`} />
              </div>
            </article>

            <article className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-royal">Manual Subscription Update</p>
                  <h2 className="mt-1 text-xl font-black text-ink">Plan and status</h2>
                </div>
                <button className={primaryButtonClassName} onClick={saveSubscription} disabled={savingSubscription}>
                  {savingSubscription ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Plan">
                  <select className={inputClassName} value={subscriptionForm.plan} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, plan: event.target.value })}>
                    {plans.map((plan) => <option key={plan} value={plan}>{plan.replace(/_/g, " ")}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className={inputClassName} value={subscriptionForm.status} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, status: event.target.value })}>
                    {subscriptionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </Field>
                <Field label="Period start">
                  <input className={inputClassName} type="date" value={subscriptionForm.currentPeriodStart} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, currentPeriodStart: event.target.value })} />
                </Field>
                <Field label="Period end">
                  <input className={inputClassName} type="date" value={subscriptionForm.currentPeriodEnd} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, currentPeriodEnd: event.target.value })} />
                </Field>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-black uppercase text-slate-500">Notes</span>
                  <textarea className={textareaClassName} value={subscriptionForm.notes} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, notes: event.target.value })} placeholder="Manual activation notes, client agreement details, or renewal context." />
                </label>
              </div>
            </article>
          </section>
        ) : null}
      </DataState>

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <article className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
          <p className="text-xs font-black uppercase text-royal">Manual Payment Records</p>
          <h2 className="mt-1 text-xl font-black text-ink">Add payment</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Amount">
              <input className={inputClassName} type="number" min="1" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} placeholder="5000" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Currency">
                <input className={inputClassName} value={paymentForm.currency} onChange={(event) => setPaymentForm({ ...paymentForm, currency: event.target.value.toUpperCase() })} />
              </Field>
              <Field label="Paid date">
                <input className={inputClassName} type="date" value={paymentForm.paidAt} onChange={(event) => setPaymentForm({ ...paymentForm, paidAt: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Method">
                <select className={inputClassName} value={paymentForm.method} onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })}>
                  {methods.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClassName} value={paymentForm.status} onChange={(event) => setPaymentForm({ ...paymentForm, status: event.target.value })}>
                  {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Transaction reference">
              <input className={inputClassName} value={paymentForm.transactionRef} onChange={(event) => setPaymentForm({ ...paymentForm, transactionRef: event.target.value })} placeholder="Manual receipt, bKash, bank ref, or note" />
            </Field>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-500">Notes</span>
              <textarea className={textareaClassName} value={paymentForm.notes} onChange={(event) => setPaymentForm({ ...paymentForm, notes: event.target.value })} placeholder="Admin verification details. Do not store card data." />
            </label>
            <button className={primaryButtonClassName} onClick={addPayment} disabled={addingPayment}>
              {addingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Add Payment
            </button>
          </div>
        </article>

        <DataState loading={paymentsRequest.loading} error={paymentsRequest.error} empty={payments.length === 0} emptyText="No manual payment records yet.">
          <article className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
            <div className="flex items-center gap-3 border-b border-blue-100 p-5">
              <History className="h-5 w-5 text-royal" />
              <h2 className="text-lg font-black text-ink">Payment History</h2>
            </div>
            <div className="divide-y divide-blue-100">
              {payments.map((payment) => (
                <div key={payment.id} className="grid gap-3 p-5 lg:grid-cols-[150px_1fr_120px_120px] lg:items-center">
                  <div>
                    <p className="text-sm font-black text-ink">{formatDate(payment.paidAt || payment.createdAt)}</p>
                    <p className="text-xs font-bold text-slate-500">{payment.currency} {payment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-ink">{payment.method}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{payment.transactionRef || "No reference"}</p>
                    {payment.notes ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{payment.notes}</p> : null}
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-center text-xs font-black text-royal ring-1 ring-blue-100">{payment.status}</span>
                  <p className="text-xs font-bold text-slate-500">Recorded {formatDate(payment.createdAt)}</p>
                </div>
              ))}
            </div>
          </article>
        </DataState>
      </section>

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] bg-blue-50 px-4 py-3">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-right text-sm font-black text-ink">{value}</span>
    </div>
  );
}
