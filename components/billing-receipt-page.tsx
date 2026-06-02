"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Printer, ReceiptText } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import { primaryButtonClassName, secondaryButtonClassName } from "./saas-page-utils";

type ReceiptResponse = {
  payment: {
    id: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    transactionRef: string;
    paidAt: string | null;
    notes: string;
    createdAt: string | null;
    subscription: {
      plan: string;
      status: string;
      billingMode: string;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
    } | null;
    company: {
      name: string;
      workspaceName: string;
    };
  };
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function BillingReceiptPage({ paymentId }: { paymentId: string }) {
  const [data, setData] = useState<ReceiptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiRequest<ReceiptResponse>(`/api/billing/payments/${paymentId}`)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paymentId]);

  const payment = data?.payment;

  return (
    <AppShell>
      <section className="print:hidden rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <ReceiptText className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Manual Receipt</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Payment Receipt</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Printable manual payment record. Gateway automation is not active.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/billing" className={secondaryButtonClassName}>
              <ArrowLeft className="h-4 w-4" />
              Billing
            </Link>
            <button className={primaryButtonClassName} onClick={() => window.print()} disabled={!payment}>
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[18px] border border-blue-100 bg-blue-50 p-6 text-sm font-bold text-royal">Loading receipt...</div>
      ) : error ? (
        <div className="rounded-[18px] border border-rose-100 bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error}</div>
      ) : payment ? (
        <section className="mx-auto max-w-4xl rounded-[24px] border border-blue-100 bg-white/95 p-6 shadow-panel print:border-0 print:shadow-none sm:p-8">
          <div className="flex flex-col gap-4 border-b border-blue-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-royal">ARBCore SwiftConnect</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Manual Payment Receipt</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Receipt ID: {payment.id}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-black text-ink">{payment.company.name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{payment.company.workspaceName}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ReceiptRow label="Payment ID" value={payment.id} />
            <ReceiptRow label="Plan" value={payment.subscription?.plan?.replace(/_/g, " ") || "Manual beta"} />
            <ReceiptRow label="Amount" value={`${payment.currency} ${payment.amount.toLocaleString()}`} />
            <ReceiptRow label="Status" value={payment.status} />
            <ReceiptRow label="Method" value={payment.method} />
            <ReceiptRow label="Transaction reference" value={payment.transactionRef || "-"} />
            <ReceiptRow label="Paid date" value={formatDate(payment.paidAt)} />
            <ReceiptRow label="Created date" value={formatDate(payment.createdAt)} />
            <ReceiptRow label="Subscription status" value={payment.subscription?.status || "-"} />
            <ReceiptRow label="Billing mode" value={payment.subscription?.billingMode || "MANUAL"} />
          </div>

          {payment.notes ? (
            <div className="mt-6 rounded-[18px] bg-blue-50 p-4">
              <p className="text-xs font-black uppercase text-slate-500">Notes</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{payment.notes}</p>
            </div>
          ) : null}

          <p className="mt-6 rounded-[18px] border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
            Manual payment record. Gateway automation is not active. Pending payments are not confirmed payments, and this receipt does not store or display card data.
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-blue-50 px-4 py-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-ink">{value}</p>
    </div>
  );
}
