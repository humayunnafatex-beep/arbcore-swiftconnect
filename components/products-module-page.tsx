"use client";

import { useMemo, useState } from "react";
import { Archive, ImageIcon, PackageOpen, RefreshCw, Save, Search } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { PRODUCT_STATUSES, type ProductStatus } from "@/lib/product-input";
import { AppShell } from "./app-shell";
import { DataState, Toast, formatDate, inputClassName, primaryButtonClassName, secondaryButtonClassName, useApiData, useToast } from "./saas-page-utils";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  availableSizes: string;
  stockNote: string;
  imageUrl: string;
  status: ProductStatus | string;
  notes: string;
  updatedAt: string;
};

type ProductsResponse = {
  products: Product[];
};

const emptyForm = {
  name: "",
  sku: "",
  price: "0",
  availableSizes: "",
  stockNote: "",
  imageUrl: "",
  status: "ACTIVE",
  notes: ""
};

export function ProductsModulePage() {
  const { toast, showToast } = useToast();
  const initialFilters = getInitialProductFilters();
  const [status, setStatus] = useState(initialFilters.status);
  const [search, setSearch] = useState(initialFilters.search);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "200" });
    if (status !== "ALL") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [status, search]);
  const products = useApiData<ProductsResponse>(`/api/products?${query}`);
  const items = products.data?.products ?? [];

  async function saveProduct() {
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editingId) {
        await apiRequest<{ product: Product }>(`/api/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        showToast("Product updated.");
      } else {
        await apiRequest<{ product: Product }>("/api/products", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast("Product created.");
      }

      resetForm();
      products.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  async function archiveProduct(product: Product) {
    try {
      await apiRequest<{ product: Product; archived: boolean }>(`/api/products/${product.id}`, { method: "DELETE" });
      showToast("Product archived.");
      if (editingId === product.id) resetForm();
      products.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      availableSizes: product.availableSizes,
      stockNote: product.stockNote,
      imageUrl: product.imageUrl,
      status: product.status || "ACTIVE",
      notes: product.notes
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <AppShell>
      <main className="space-y-6">
        <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
                <PackageOpen className="h-8 w-8" />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-royal">Product Catalog</p>
                <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Products</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Manual product/model list for faster order entry. No inventory deduction, checkout, payment gateway, or customer message automation is active.
                </p>
              </div>
            </div>
            <button className={primaryButtonClassName} type="button" onClick={products.reload}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-black text-ink">{editingId ? "Edit Product" : "Create Product"}</h2>
            {editingId ? <button className={secondaryButtonClassName} type="button" onClick={resetForm}>New Product</button> : null}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input className={inputClassName} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product/model name" />
            <input className={inputClassName} value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} placeholder="SKU" />
            <input className={inputClassName} type="number" min="0" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="Price BDT" />
            <select className={inputClassName} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {PRODUCT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input className={inputClassName} value={form.availableSizes} onChange={(event) => setForm((current) => ({ ...current, availableSizes: event.target.value }))} placeholder="Sizes: 40, 41, 42" />
            <input className={inputClassName} value={form.stockNote} onChange={(event) => setForm((current) => ({ ...current, stockNote: event.target.value }))} placeholder="Stock note" />
            <input className={`${inputClassName} xl:col-span-2`} value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Image URL https://..." />
          </div>
          <textarea
            className="mt-3 min-h-20 w-full rounded-[14px] border border-blue-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Internal product notes"
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-slate-500">Product data is manual. Stock notes do not change automatically when orders are created.</p>
            <button className={`${primaryButtonClassName} w-full sm:w-auto`} type="button" onClick={() => void saveProduct()} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editingId ? "Save Product" : "Create Product"}
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
          <div className="grid gap-3 md:grid-cols-[180px_1fr]">
            <select className={inputClassName} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">All statuses</option>
              {PRODUCT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input className={`${inputClassName} w-full pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, SKU, sizes, stock note" />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
          <DataState loading={products.loading} error={products.error} empty={!items.length} emptyText="No products match this view. Create a product to speed up order entry.">
            <div className="grid gap-3 p-4 lg:hidden">
              {items.map((product) => <ProductCard key={product.id} product={product} onEdit={editProduct} onArchive={archiveProduct} />)}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[1120px] w-full text-left">
                <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500">
                  <tr>
                    {["Product", "SKU", "Price", "Sizes", "Stock note", "Status", "Updated", "Actions"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {items.map((product) => (
                    <tr key={product.id} className="text-sm font-semibold text-slate-600">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <ProductImage product={product} />
                          <span className="font-black text-ink">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">{product.sku || "-"}</td>
                      <td className="px-4 py-4">BDT {product.price.toLocaleString()}</td>
                      <td className="px-4 py-4">{product.availableSizes || "-"}</td>
                      <td className="px-4 py-4">{product.stockNote || "-"}</td>
                      <td className="px-4 py-4"><StatusPill status={product.status} /></td>
                      <td className="px-4 py-4">{formatDate(product.updatedAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button className={`${secondaryButtonClassName} h-9 px-3 text-xs`} type="button" onClick={() => editProduct(product)}>Edit</button>
                          <button className={`${secondaryButtonClassName} h-9 px-3 text-xs`} type="button" onClick={() => void archiveProduct(product)}>
                            <Archive className="h-4 w-4" />
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataState>
        </section>
      </main>
      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function ProductCard({ product, onEdit, onArchive }: { product: Product; onEdit: (product: Product) => void; onArchive: (product: Product) => Promise<void> }) {
  return (
    <article className="rounded-[18px] border border-blue-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <ProductImage product={product} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-ink">{product.name}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">{product.sku || "No SKU"}</p>
          <p className="mt-2 text-sm font-black text-royal">BDT {product.price.toLocaleString()}</p>
        </div>
        <StatusPill status={product.status} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600">Sizes: {product.availableSizes || "-"}</p>
      <p className="mt-2 text-sm font-semibold text-slate-600">Stock note: {product.stockNote || "-"}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">Updated {formatDate(product.updatedAt)}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button className={`${secondaryButtonClassName} justify-center text-xs`} type="button" onClick={() => onEdit(product)}>Edit</button>
        <button className={`${secondaryButtonClassName} justify-center text-xs`} type="button" onClick={() => void onArchive(product)}>
          <Archive className="h-4 w-4" />
          Archive
        </button>
      </div>
    </article>
  );
}

function ProductImage({ product }: { product: Product }) {
  if (!product.imageUrl) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-blue-50 text-royal ring-1 ring-blue-100">
        <ImageIcon className="h-5 w-5" />
      </span>
    );
  }

  return <img className="h-12 w-12 shrink-0 rounded-[14px] object-cover ring-1 ring-blue-100" src={product.imageUrl} alt="" />;
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "ACTIVE" ? "emerald" : status === "ARCHIVED" ? "rose" : "blue";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ring-1 ${tone === "emerald" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : tone === "rose" ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-blue-50 text-royal ring-blue-100"}`}>
      {status}
    </span>
  );
}

function getInitialProductFilters() {
  if (typeof window === "undefined") {
    return { status: "ACTIVE", search: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    status: params.get("status")?.trim() || "ACTIVE",
    search: params.get("search")?.trim() || ""
  };
}
