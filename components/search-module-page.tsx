"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Inbox, PackageOpen, RefreshCw, Search, ShoppingBag, Users } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import { DataState, inputClassName, primaryButtonClassName, secondaryButtonClassName } from "./saas-page-utils";

type SearchItem = {
  id: string;
  module: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
};

type SearchState = {
  inbox: SearchItem[];
  contacts: SearchItem[];
  orders: SearchItem[];
  products: SearchItem[];
  campaigns: SearchItem[];
  savedReplies: SearchItem[];
  messageLogs: SearchItem[];
};

const emptyResults: SearchState = {
  inbox: [],
  contacts: [],
  orders: [],
  products: [],
  campaigns: [],
  savedReplies: [],
  messageLogs: []
};

export function SearchModulePage() {
  const initialQuery = getInitialQuery();
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchState>(emptyResults);
  const [loading, setLoading] = useState(Boolean(initialQuery));
  const [error, setError] = useState<string | null>(null);

  const allResults = useMemo(() => {
    return [
      ...results.inbox,
      ...results.contacts,
      ...results.orders,
      ...results.products,
      ...results.campaigns,
      ...results.savedReplies,
      ...results.messageLogs
    ];
  }, [results]);

  useEffect(() => {
    if (!submittedQuery.trim()) {
      setResults(emptyResults);
      setLoading(false);
      setError(null);
      return;
    }

    void loadResults(submittedQuery);
  }, [submittedQuery]);

  async function loadResults(searchText: string) {
    setLoading(true);
    setError(null);

    try {
      const safeQuery = searchText.trim();
      const encoded = encodeURIComponent(safeQuery);
      const [
        inbox,
        contacts,
        orders,
        products,
        campaigns,
        savedReplies,
        messageLogs
      ] = await Promise.all([
        fetchJson(`/api/inbox/conversations?search=${encoded}&limit=5`),
        fetchJson(`/api/contacts?search=${encoded}&pageSize=5`),
        fetchJson(`/api/orders?search=${encoded}&limit=5`),
        fetchJson(`/api/products?search=${encoded}&limit=5`),
        fetchJson(`/api/campaigns?search=${encoded}&pageSize=5`),
        fetchJson(`/api/saved-replies?search=${encoded}&limit=5`),
        fetchJson(`/api/whatsapp/logs?search=${encoded}&limit=5`)
      ]);

      setResults({
        inbox: mapList(inbox?.conversations, "Inbox", (item) => ({
          id: text(item.id) || `${text(item.channel)}:${text(item.contactKey)}`,
          title: text(item.displayName) || text(item.contactName) || text(item.contactKey) || "Conversation",
          subtitle: text(item.lastMessagePreview) || text(item.bodyPreview) || "Conversation match",
          meta: [text(item.channel), text(item.status), text(item.priority)].filter(Boolean).join(" / "),
          href: `/inbox?search=${encoded}`
        })),
        contacts: mapList(contacts?.items, "Contacts", (item) => ({
          id: text(item.id),
          title: text(item.name) || text(item.whatsappProfileName) || text(item.phone) || "Contact",
          subtitle: [text(item.phone), text(item.email)].filter(Boolean).join(" / "),
          meta: [text(item.stage), text(item.tags)].filter(Boolean).join(" / "),
          href: `/contacts?search=${encoded}`
        })),
        orders: mapList(orders?.orders, "Orders", (item) => ({
          id: text(item.id),
          title: text(item.orderNumber) || text(item.modelName) || "Order",
          subtitle: [text(item.customerName), text(item.customerPhone), text(item.modelName)].filter(Boolean).join(" / "),
          meta: [text(item.orderStatus), text(item.paymentStatus)].filter(Boolean).join(" / "),
          href: `/orders?search=${encoded}`
        })),
        products: mapList(products?.products, "Products", (item) => ({
          id: text(item.id),
          title: text(item.name) || text(item.sku) || "Product",
          subtitle: [text(item.sku), text(item.availableSizes), text(item.stockNote)].filter(Boolean).join(" / "),
          meta: [text(item.status), money(item.price)].filter(Boolean).join(" / "),
          href: `/products?search=${encoded}`
        })),
        campaigns: mapList(campaigns?.items, "Campaigns", (item) => ({
          id: text(item.id),
          title: text(item.name) || "Campaign",
          subtitle: text(item.messageBody) || text(item.audienceNote) || "Campaign match",
          meta: [text(item.channel), text(item.status)].filter(Boolean).join(" / "),
          href: `/campaigns?search=${encoded}`
        })),
        savedReplies: mapList(savedReplies?.replies ?? savedReplies?.items, "Saved Replies", (item) => ({
          id: text(item.id),
          title: text(item.title) || text(item.shortcut) || "Saved reply",
          subtitle: text(item.body) || "Saved reply match",
          meta: [text(item.category), text(item.channel), text(item.status)].filter(Boolean).join(" / "),
          href: `/saved-replies?search=${encoded}`
        })),
        messageLogs: mapList(messageLogs?.messages, "Message Logs", (item) => ({
          id: text(item.id),
          title: text(item.phone) || text(item.providerMessageId) || "Message log",
          subtitle: text(item.bodyPreview) || text(item.errorMessage) || "Message log match",
          meta: [text(item.channel), text(item.direction), text(item.status)].filter(Boolean).join(" / "),
          href: `/message-logs?search=${encoded}`
        }))
      });
    } catch (searchError) {
      setError(getApiErrorMessage(searchError));
    } finally {
      setLoading(false);
    }
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const safeQuery = query.trim();
    setSubmittedQuery(safeQuery);
    if (safeQuery) {
      window.history.replaceState(null, "", `/search?q=${encodeURIComponent(safeQuery)}`);
    }
  }

  return (
    <AppShell>
      <main className="space-y-6">
        <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
                <Search className="h-8 w-8" />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-royal">Workspace search</p>
                <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Search</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Search existing Inbox conversations, Contacts, Orders, Products, Campaigns, Saved Replies, and Message Logs. Results use safe previews from existing read-only APIs.
                </p>
              </div>
            </div>
            <Link href="/dashboard" className={secondaryButtonClassName}>Back to Dashboard</Link>
          </div>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={submitSearch}>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                className={`${inputClassName} w-full pl-9`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer, phone, order, product, campaign, saved reply"
                aria-label="Search workspace"
              />
            </label>
            <button className={primaryButtonClassName} type="submit">
              <RefreshCw className="h-4 w-4" />
              Search
            </button>
          </form>
        </section>

        <DataState
          loading={loading}
          error={error}
          empty={!submittedQuery.trim() || !allResults.length}
          emptyText={submittedQuery.trim() ? "No workspace results matched this search." : "Enter a search term to find matching workspace records."}
        >
          <section className="grid gap-4 xl:grid-cols-2">
            <ResultSection title="Inbox" icon={<Inbox className="h-5 w-5" />} items={results.inbox} />
            <ResultSection title="Contacts" icon={<Users className="h-5 w-5" />} items={results.contacts} />
            <ResultSection title="Orders" icon={<ShoppingBag className="h-5 w-5" />} items={results.orders} />
            <ResultSection title="Products" icon={<PackageOpen className="h-5 w-5" />} items={results.products} />
            <ResultSection title="Campaigns" icon={<ClipboardList className="h-5 w-5" />} items={results.campaigns} />
            <ResultSection title="Saved Replies" icon={<ClipboardList className="h-5 w-5" />} items={results.savedReplies} />
            <ResultSection title="Message Logs" icon={<ClipboardList className="h-5 w-5" />} items={results.messageLogs} />
          </section>
        </DataState>
      </main>
    </AppShell>
  );
}

function ResultSection({ title, icon, items }: { title: string; icon: React.ReactNode; items: SearchItem[] }) {
  return (
    <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-black text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-blue-50 text-royal ring-1 ring-blue-100">{icon}</span>
          {title}
        </h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-royal">{items.length}</span>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={`${item.module}:${item.id}`} href={item.href} className="block rounded-[18px] border border-blue-100 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
              <p className="line-clamp-1 text-sm font-black text-ink">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{item.subtitle || "Open matching records."}</p>
              {item.meta ? <p className="mt-2 text-xs font-bold uppercase text-royal">{item.meta}</p> : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-[18px] border border-dashed border-blue-200 bg-blue-50/60 p-4 text-sm font-semibold text-slate-500">No matches in this area.</p>
      )}
    </section>
  );
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || "Search request failed.");
  }

  return result?.data ?? result;
}

function mapList<T>(items: T[] | undefined, module: string, mapItem: (item: Record<string, unknown>) => Omit<SearchItem, "module">): SearchItem[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 5).map((item, index) => {
    const mapped = mapItem(item as Record<string, unknown>);
    return {
      ...mapped,
      id: mapped.id || `${module}-${index}`,
      module
    };
  });
}

function getInitialQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function money(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? `BDT ${value.toLocaleString()}` : "";
}
