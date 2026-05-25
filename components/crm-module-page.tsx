"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleDollarSign, KanbanSquare, Plus, RefreshCw, Search, Target, UserRound } from "lucide-react";
import { apiRequest, getApiErrorMessage, type ListResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import {
  DataState,
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

type CrmDeal = {
  id: string;
  title: string;
  value: number;
  stage: string;
  status: string;
  owner: string | null;
  nextAction: string | null;
  dueAt: string | null;
  contact: Contact;
};

type CrmPipelineResponse = {
  pipeline: Array<{ stage: string; count: number; value: number }>;
  deals: CrmDeal[];
  pagination: { page: number; pageSize: number; total: number };
};

const stages = [
  { key: "NEW_LEAD", label: "New Leads" },
  { key: "INTERESTED", label: "Interested" },
  { key: "FOLLOW_UP", label: "Follow-up" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
  { key: "DO_NOT_CONTACT", label: "Do Not Contact" }
];

export function CrmModulePage() {
  const pipeline = useApiData<CrmPipelineResponse>("/api/crm/pipeline?pageSize=200");
  const contacts = useApiData<ListResponse<Contact>>("/api/contacts?pageSize=200");
  const { toast, showToast } = useToast();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "New CRM Deal",
    contactId: "",
    value: "15000",
    stage: "INTERESTED",
    owner: "Rasel Ahmed",
    nextAction: "Send catalog",
    dueAt: "",
    note: "Customer is interested in WhatsApp campaign automation."
  });

  useEffect(() => {
    const firstContactId = contacts.data?.items[0]?.id;
    if (!form.contactId && firstContactId) setForm((current) => ({ ...current, contactId: firstContactId }));
  }, [contacts.data?.items, form.contactId]);

  const deals = pipeline.data?.deals ?? [];
  const displayDeals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const mapped = deals.map((deal) => ({
      ...deal,
      boardStage: deal.nextAction?.toLowerCase().includes("do not contact") ? "DO_NOT_CONTACT" : deal.stage
    }));
    if (!normalized) return mapped;
    return mapped.filter((deal) =>
      [deal.title, deal.contact.name, deal.contact.phone, deal.contact.segment ?? "", deal.owner ?? "", deal.nextAction ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [deals, query]);

  const totalValue = displayDeals.reduce((sum, deal) => sum + deal.value, 0);
  const openCount = displayDeals.filter((deal) => deal.status === "OPEN").length;

  async function createDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await apiRequest<CrmDeal>("/api/crm/pipeline", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          contactId: form.contactId,
          value: Number(form.value),
          stage: form.stage === "DO_NOT_CONTACT" ? "LOST" : form.stage,
          status: form.stage === "WON" ? "WON" : form.stage === "LOST" || form.stage === "DO_NOT_CONTACT" ? "LOST" : "OPEN",
          owner: form.owner || null,
          nextAction: form.stage === "DO_NOT_CONTACT" ? `Do not contact. ${form.note}` : `${form.nextAction}${form.note ? ` | ${form.note}` : ""}`,
          dueAt: form.dueAt || null
        })
      });
      showToast("CRM deal created.");
      pipeline.reload();
      setFormOpen(false);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  async function updateStage(deal: CrmDeal, nextStage: string) {
    setBusy(true);
    try {
      await apiRequest<CrmDeal>(`/api/crm/pipeline/${deal.id}`, {
        method: "PUT",
        body: JSON.stringify({
          stage: nextStage === "DO_NOT_CONTACT" ? "LOST" : nextStage,
          status: nextStage === "WON" ? "WON" : nextStage === "LOST" || nextStage === "DO_NOT_CONTACT" ? "LOST" : "OPEN",
          nextAction: nextStage === "DO_NOT_CONTACT" ? "Do not contact" : deal.nextAction
        })
      });
      showToast("Deal stage updated.");
      pipeline.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
              <KanbanSquare className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-royal">CRM Pipeline</p>
              <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Sales Pipeline</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Track workspace leads, follow-ups, owners, and deal movement across the ARBCore sales board.</p>
            </div>
          </div>
          <button className={primaryButtonClassName} onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            New Deal
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Pipeline value" value={`BDT ${totalValue.toLocaleString()}`} helper={`${displayDeals.length} visible deals`} />
        <Metric label="Open deals" value={openCount.toLocaleString()} helper="Still in progress" />
        <Metric label="Won value" value={`BDT ${displayDeals.filter((deal) => deal.stage === "WON").reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}`} helper="Closed revenue" />
        <Metric label="Owners" value={new Set(displayDeals.map((deal) => deal.owner).filter(Boolean)).size.toLocaleString()} helper="Assigned users" />
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClassName} w-full pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contact, phone, source, owner, note" />
          </label>
          <div className="rounded-[14px] border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-slate-600">{pipeline.data?.pagination.total ?? 0} total deals</div>
          <button className={secondaryButtonClassName} onClick={pipeline.reload}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <DataState loading={pipeline.loading} error={pipeline.error} empty={!displayDeals.length} emptyText="No CRM deals yet. Create a deal from an existing contact.">
        <section className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-6">
          {stages.map((stage) => {
            const stageDeals = displayDeals.filter((deal) => deal.boardStage === stage.key);
            const value = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
            return (
              <div key={stage.key} className="min-w-[280px] rounded-[22px] border border-blue-100 bg-blue-50/70 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-ink">{stage.label}</h2>
                    <p className="text-xs font-semibold text-slate-500">BDT {value.toLocaleString()}</p>
                  </div>
                  <span className="grid h-8 min-w-8 place-items-center rounded-full bg-white px-2 text-xs font-black text-royal ring-1 ring-blue-100">{stageDeals.length}</span>
                </div>
                <div className="space-y-3">
                  {stageDeals.length ? (
                    stageDeals.map((deal) => <DealCard key={deal.id} deal={deal} onStageUpdate={updateStage} busy={busy} />)
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-blue-200 bg-white/70 p-4 text-center text-xs font-semibold text-slate-400">No deals</div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </DataState>

      {formOpen ? (
        <Modal title="Create Deal" onClose={() => setFormOpen(false)}>
          <form className="grid gap-3" onSubmit={(event) => void createDeal(event)}>
            <input className={inputClassName} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Deal title" required />
            <select className={inputClassName} value={form.contactId} onChange={(event) => setForm({ ...form, contactId: event.target.value })} required>
              {(contacts.data?.items ?? []).map((contact) => <option key={contact.id} value={contact.id}>{contact.name} - {contact.phone}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClassName} value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} placeholder="Value" />
              <select className={inputClassName} value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>
                {stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClassName} value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} placeholder="Assigned user" />
              <input className={inputClassName} type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} />
            </div>
            <input className={inputClassName} value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} placeholder="Next follow-up" />
            <textarea className={textareaClassName} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Note" />
            <button className={primaryButtonClassName} disabled={busy}>Create Deal</button>
          </form>
        </Modal>
      ) : null}

      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function DealCard({ deal, onStageUpdate, busy }: { deal: CrmDeal; onStageUpdate: (deal: CrmDeal, stage: string) => Promise<void>; busy: boolean }) {
  const nextStage = getNextStage(deal.stage);
  return (
    <article className="rounded-[18px] border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-black text-ink">{deal.title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{deal.contact.name}</p>
          <p className="text-xs font-semibold text-slate-500">{deal.contact.phone}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal to-electric text-xs font-black text-white">{initials(deal.contact.name)}</span>
      </div>
      <p className="mt-4 text-lg font-black text-ink">BDT {deal.value.toLocaleString()}</p>
      <div className="mt-3 space-y-2">
        <InfoRow label="Source" value={deal.contact.segment ?? "Direct"} />
        <InfoRow label="Next follow-up" value={formatDate(deal.dueAt)} />
        <InfoRow label="Assigned user" value={deal.owner ?? "Unassigned"} />
        <InfoRow label="Note" value={deal.nextAction ?? "No note"} />
      </div>
      <div className="mt-3 grid gap-2">
        {nextStage ? (
          <button className={secondaryButtonClassName} onClick={() => void onStageUpdate(deal, nextStage)} disabled={busy}>
            Move <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
        <button className="h-10 rounded-[14px] border border-rose-100 bg-rose-50 px-3 text-xs font-black text-rose-600" onClick={() => void onStageUpdate(deal, "DO_NOT_CONTACT")} disabled={busy}>
          Do Not Contact
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-[22px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase text-royal">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-blue-50 text-royal">{label.includes("value") ? <CircleDollarSign className="h-4 w-4" /> : label.includes("Won") ? <Target className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</span>
      </div>
      <p className="mt-3 text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-blue-100 bg-white p-5 shadow-glow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <button className="rounded-[12px] border border-blue-100 px-3 py-2 text-sm font-black text-royal" onClick={onClose}>Close</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] bg-slate-50 px-3 py-2">
      <span className="shrink-0 text-[11px] font-bold text-slate-400">{label}</span>
      <span className="truncate text-[11px] font-black text-slate-600">{value}</span>
    </div>
  );
}

function getNextStage(stage: string) {
  const order = ["NEW_LEAD", "INTERESTED", "FOLLOW_UP", "WON"];
  const index = order.indexOf(stage);
  return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
}
