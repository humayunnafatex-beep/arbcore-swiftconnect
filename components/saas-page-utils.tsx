"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type ToastState = {
  message: string;
  tone: "success" | "error";
};

export function useApiData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    apiRequest<T>(path)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, refreshIndex]);

  return {
    data,
    loading,
    error,
    reload: () => setRefreshIndex((current) => current + 1)
  };
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, tone: ToastState["tone"] = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  return { toast, showToast };
}

export function Toast({ message, tone }: ToastState) {
  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-2 rounded-[16px] px-4 py-3 text-sm font-bold shadow-glow",
        tone === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
      )}
    >
      {tone === "success" ? <Check className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
      {message}
    </div>
  );
}

export function DataState({
  loading,
  error,
  empty,
  emptyText,
  children
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid min-h-40 place-items-center rounded-[18px] border border-blue-100 bg-blue-50 text-sm font-bold text-royal">
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading workspace data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  if (empty) {
    return <EmptyState text={emptyText} />;
  }

  return <>{children}</>;
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-[18px] border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center text-sm font-semibold text-slate-500">
      <span>
        <Sparkles className="mx-auto mb-2 h-6 w-6 text-royal" />
        {text}
      </span>
    </div>
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export const inputClassName =
  "h-11 min-w-0 rounded-[14px] border border-blue-100 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100";

export const textareaClassName =
  "min-h-24 rounded-[14px] border border-blue-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100";

export const primaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-royal to-electric px-4 text-sm font-bold text-white shadow-glow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-white px-4 text-sm font-bold text-royal transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60";
