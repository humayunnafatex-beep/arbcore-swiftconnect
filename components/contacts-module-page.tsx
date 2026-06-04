"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Download, Edit3, FileSpreadsheet, Plus, RefreshCw, Search, Trash2, Upload, Users } from "lucide-react";
import { apiRequest, getApiErrorMessage, type ListResponse } from "@/lib/api-client";
import { AppShell } from "./app-shell";
import {
  DataState,
  Toast,
  formatDate,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  useApiData,
  useToast
} from "./saas-page-utils";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string | null;
  segment: string | null;
  stage: ContactStage;
  optedIn: boolean;
  createdAt: string;
  updatedAt: string;
};

type ContactStage = "NEW_LEAD" | "INTERESTED" | "FOLLOW_UP" | "WON" | "LOST";

type ContactForm = {
  name: string;
  phone: string;
  email: string;
  tags: string;
  segment: string;
  stage: ContactStage;
  optedIn: boolean;
};

const emptyForm: ContactForm = {
  name: "",
  phone: "",
  email: "",
  tags: "",
  segment: "",
  stage: "NEW_LEAD",
  optedIn: true
};

const stages: ContactStage[] = ["NEW_LEAD", "INTERESTED", "FOLLOW_UP", "WON", "LOST"];

const stageLabels: Record<ContactStage, string> = {
  NEW_LEAD: "New Lead",
  INTERESTED: "Interested",
  FOLLOW_UP: "Follow-up",
  WON: "Won",
  LOST: "Lost"
};

export function ContactsModulePage() {
  const contacts = useApiData<ListResponse<Contact>>("/api/contacts?pageSize=500");
  const { toast, showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importWarning, setImportWarning] = useState<string | null>(null);

  const allContacts = contacts.data?.items ?? [];
  const existingPhones = useMemo(() => new Set(allContacts.map((contact) => normalizePhone(contact.phone))), [allContacts]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    allContacts.forEach((contact) => splitTags(contact.tags).forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [allContacts]);

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(allContacts.map((contact) => contact.segment).filter(Boolean) as string[])).sort();
  }, [allContacts]);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allContacts.filter((contact) => {
      const matchesSearch =
        !query ||
        contact.name.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query) ||
        (contact.email ?? "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || contact.stage === statusFilter;
      const matchesTag = tagFilter === "all" || splitTags(contact.tags).includes(tagFilter);
      const matchesSource = sourceFilter === "all" || contact.segment === sourceFilter;

      return matchesSearch && matchesStatus && matchesTag && matchesSource;
    });
  }, [allContacts, search, sourceFilter, statusFilter, tagFilter]);

  function openCreateModal() {
    setForm(emptyForm);
    setEditingContact(null);
    setModalMode("create");
  }

  function openEditModal(contact: Contact) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email ?? "",
      tags: contact.tags ?? "",
      segment: contact.segment ?? "",
      stage: contact.stage,
      optedIn: contact.optedIn
    });
    setModalMode("edit");
  }

  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();

    if (!name) {
      showToast("Contact name is required.", "error");
      return;
    }

    if (!phone) {
      showToast("Phone number is required.", "error");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Enter a valid email address or leave it blank.", "error");
      return;
    }

    const duplicate = allContacts.find(
      (contact) => normalizePhone(contact.phone) === normalizePhone(phone) && contact.id !== editingContact?.id
    );

    if (duplicate) {
      showToast(`This phone number already belongs to ${duplicate.name}.`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        phone,
        email: email || null,
        tags: form.tags.trim() || null,
        segment: form.segment.trim() || null,
        stage: form.stage,
        optedIn: form.optedIn
      };

      if (modalMode === "edit" && editingContact) {
        await apiRequest<Contact>(`/api/contacts/${editingContact.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        showToast("Contact saved.");
      } else {
        await apiRequest<Contact>("/api/contacts", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast("Contact saved.");
      }

      contacts.reload();
      setModalMode(null);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteContact() {
    if (!deletingContact) return;
    if (!window.confirm(`Delete contact "${deletingContact.name}"? This cannot be undone.`)) return;

    setSubmitting(true);
    try {
      await apiRequest<{ deleted: boolean }>(`/api/contacts/${deletingContact.id}`, { method: "DELETE" });
      showToast("Contact deleted.");
      contacts.reload();
      setDeletingContact(null);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImport() {
    if (!importFile) {
      showToast("Choose a CSV or Excel file first.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);
    setImporting(true);
    try {
      const response = await apiRequest<{ imported: number }>("/api/contacts/import", {
        method: "POST",
        body: formData
      });
      showToast(`Imported ${response.imported} contact(s).`);
      setImportFile(null);
      setImportWarning(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      contacts.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setImporting(false);
    }
  }

  async function analyzeImportFile(file: File | null) {
    setImportFile(file);
    setImportWarning(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportWarning("Duplicate phone warning: Excel imports update existing phone numbers if duplicates are found.");
      return;
    }

    const text = await file.text();
    const phones = extractPhonesFromCsv(text);
    const duplicates = phones.filter((phone) => existingPhones.has(normalizePhone(phone)));

    if (duplicates.length > 0) {
      setImportWarning(`Duplicate phone warning: ${duplicates.slice(0, 4).join(", ")} already exist and will be updated.`);
    } else {
      setImportWarning("No duplicate phone numbers detected in this CSV.");
    }
  }

  function exportCsv() {
    const rows = [
      ["Name", "Phone", "Email", "Source", "Tags", "Status", "Last Contacted", "Created At"],
      ...filteredContacts.map((contact) => [
        contact.name,
        contact.phone,
        contact.email ?? "",
        contact.segment ?? "",
        contact.tags ?? "",
        stageLabels[contact.stage],
        contact.updatedAt,
        contact.createdAt
      ])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "arbcore-contacts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <Users className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">Contact Center</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Contacts</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Manage customer records, segments, consent, and import lists for workspace campaigns.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className={`${secondaryButtonClassName} w-full sm:w-auto`} onClick={exportCsv} disabled={!filteredContacts.length}>
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button className={`${primaryButtonClassName} w-full sm:w-auto`} onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              New Contact
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Total contacts" value={allContacts.length.toLocaleString()} helper="Workspace records" />
        <Metric label="Opted in" value={allContacts.filter((contact) => contact.optedIn).length.toLocaleString()} helper="Ready for campaigns" />
        <Metric label="Segments" value={sourceOptions.length.toLocaleString()} helper="Active sources" />
        <Metric label="Visible list" value={filteredContacts.length.toLocaleString()} helper="After filters" />
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClassName} w-full pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone, or email" />
          </label>
          <select className={inputClassName} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stageLabels[stage]}
              </option>
            ))}
          </select>
          <select className={inputClassName} value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">All tags</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <select className={inputClassName} value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="all">All sources</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
          <button className={`${secondaryButtonClassName} w-full sm:w-auto`} onClick={contacts.reload}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-black text-ink">CSV / Excel Import</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Accepted headers: name, phone, email, tags, segment, stage, opted in.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <input
              ref={fileInputRef}
              className="w-full max-w-full rounded-[14px] border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-600 sm:w-auto"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => void analyzeImportFile(event.target.files?.[0] ?? null)}
            />
            <button className={`${primaryButtonClassName} w-full sm:w-auto`} onClick={() => void handleImport()} disabled={importing || !importFile}>
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Import"}
            </button>
          </div>
        </div>
        {importWarning ? (
          <div className="mt-3 rounded-[16px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            {importWarning}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-blue-100 bg-white/95 shadow-panel">
        <DataState loading={contacts.loading} error={contacts.error} empty={!filteredContacts.length} emptyText="No contacts match this view.">
          <div className="grid gap-3 p-4 lg:hidden">
            {filteredContacts.map((contact) => (
              <article key={contact.id} className="rounded-[18px] border border-blue-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-ink">{contact.name}</h3>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-600">{contact.phone}</p>
                    <p className="mt-1 break-all text-xs font-semibold text-slate-500">{contact.email ?? "No email"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">{stageLabels[contact.stage]}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {splitTags(contact.tags).length ? (
                    splitTags(contact.tags).map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-royal">{tag}</span>)
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">No tags</span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                  <span>Source: {contact.segment ?? "Direct"}</span>
                  <span>Updated: {formatDate(contact.updatedAt)}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className={`${secondaryButtonClassName} justify-center`} onClick={() => openEditModal(contact)}>
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-rose-100 px-4 text-sm font-bold text-rose-600 hover:bg-rose-50" onClick={() => setDeletingContact(contact)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="bg-blue-50/70 text-xs font-black uppercase text-slate-500">
                <tr>
                  {["Name", "Phone", "Email", "Source", "Tags", "Status", "Last Contacted", "Created At", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="text-sm font-semibold text-slate-600">
                    <td className="px-4 py-4 font-black text-ink">{contact.name}</td>
                    <td className="px-4 py-4">{contact.phone}</td>
                    <td className="px-4 py-4">{contact.email ?? "-"}</td>
                    <td className="px-4 py-4">{contact.segment ?? "Direct"}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {splitTags(contact.tags).length ? (
                          splitTags(contact.tags).map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-royal">{tag}</span>)
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{stageLabels[contact.stage]}</span>
                    </td>
                    <td className="px-4 py-4">{formatDate(contact.updatedAt)}</td>
                    <td className="px-4 py-4">{formatDate(contact.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button className="grid h-9 w-9 place-items-center rounded-[12px] border border-blue-100 text-royal hover:bg-blue-50" onClick={() => openEditModal(contact)} aria-label="Edit contact">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button className="grid h-9 w-9 place-items-center rounded-[12px] border border-rose-100 text-rose-600 hover:bg-rose-50" onClick={() => setDeletingContact(contact)} aria-label="Delete contact">
                          <Trash2 className="h-4 w-4" />
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

      {modalMode ? (
        <Modal title={modalMode === "edit" ? "Edit Contact" : "Create Contact"} onClose={() => setModalMode(null)}>
          <form className="grid gap-3" onSubmit={(event) => void saveContact(event)}>
            <input className={inputClassName} required placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className={inputClassName} required placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <input className={inputClassName} type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className={inputClassName} placeholder="Source or segment" value={form.segment} onChange={(event) => setForm({ ...form, segment: event.target.value })} />
            <input className={inputClassName} placeholder="Tags, separated by commas" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
            <select className={inputClassName} value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as ContactStage })}>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabels[stage]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input type="checkbox" checked={form.optedIn} onChange={(event) => setForm({ ...form, optedIn: event.target.checked })} />
              Opted in for WhatsApp messaging
            </label>
            <button className={primaryButtonClassName} disabled={submitting}>
              {submitting ? "Saving..." : "Save Contact"}
            </button>
          </form>
        </Modal>
      ) : null}

      {deletingContact ? (
        <Modal title="Delete Contact" onClose={() => setDeletingContact(null)}>
          <p className="text-sm leading-6 text-slate-600">
            Delete <strong>{deletingContact.name}</strong>? This removes the contact from this workspace and related local records may also be removed.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button className={`${secondaryButtonClassName} w-full sm:w-auto`} onClick={() => setDeletingContact(null)}>
              Cancel
            </button>
            <button className="inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-rose-600 px-4 text-sm font-bold text-white sm:w-auto" onClick={() => void deleteContact()} disabled={submitting}>
              Delete
            </button>
          </div>
        </Modal>
      ) : null}

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-[22px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <p className="text-xs font-black uppercase text-royal">{label}</p>
      <p className="mt-3 text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-blue-100 bg-white p-5 shadow-glow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <button className="rounded-[12px] border border-blue-100 px-3 py-2 text-sm font-black text-royal" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function splitTags(tags: string | null) {
  return (tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function extractPhonesFromCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0]?.split(",").map((header) => header.trim().toLowerCase()) ?? [];
  const phoneIndex = headers.findIndex((header) => ["phone", "mobile", "whatsapp", "whatsapp number"].includes(header));

  if (phoneIndex === -1) return [];

  return lines.slice(1).map((line) => line.split(",")[phoneIndex]?.trim()).filter(Boolean);
}
