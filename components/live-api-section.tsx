"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Wand2
} from "lucide-react";
import { type ModuleSlug } from "@/data/module-pages";
import { apiRequest, getApiErrorMessage, type ListResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Panel } from "./panel";

type ToastState = {
  message: string;
  tone: "success" | "error";
};

type WhatsAppAccount = {
  id: string;
  label: string;
  phoneNumber: string;
  businessName: string | null;
  status: string;
  qualityRating: string;
  dailyLimit: number;
  messagesUsed24h: number;
};

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string | null;
  segment: string | null;
  stage: string;
  optedIn: boolean;
};

type Campaign = {
  id: string;
  name: string;
  templateName: string;
  targetSegment: string | null;
  status: string;
  sentAt: string | null;
  _count?: { messageLogs: number };
};

type MessageLog = {
  id: string;
  body: string;
  direction: string;
  status: string;
  createdAt: string;
  contact?: Contact | null;
  campaign?: Campaign | null;
};

type Conversation = {
  id: string;
  subject: string | null;
  status: string;
  assignedTo: string | null;
  lastMessageAt: string | null;
  contact: Contact;
  messages: ConversationMessage[];
};

type ConversationMessage = {
  id: string;
  body: string;
  direction: string;
  status: string;
  createdAt: string;
};

type AutoReplyRule = {
  id: string;
  keyword: string;
  response: string;
  priority: number;
  isActive: boolean;
  matchMode: string;
};

type CrmDeal = {
  id: string;
  title: string;
  value: number;
  stage: string;
  status: string;
  owner: string | null;
  nextAction: string | null;
  contact: Contact;
};

type CrmPipelineResponse = {
  pipeline: Array<{ stage: string; count: number; value: number }>;
  deals: CrmDeal[];
  pagination: { page: number; pageSize: number; total: number };
};

type AiGeneration = {
  id: string;
  prompt: string;
  context: string | null;
  output: string;
  model: string;
  createdAt: string;
};

type AnalyticsSummary = {
  totals: Record<string, number>;
  rates: Record<string, number>;
  generatedAt: string;
};

export function LiveApiSection({ slug }: { slug: ModuleSlug }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  return (
    <div className="relative">
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      {slug === "connect" ? <ConnectLive showToast={showToast} /> : null}
      {slug === "contacts" ? <ContactsLive showToast={showToast} /> : null}
      {slug === "campaigns" ? <CampaignsLive showToast={showToast} /> : null}
      {slug === "send-messages" ? <SendMessagesLive showToast={showToast} /> : null}
      {slug === "auto-reply" ? <AutoReplyLive showToast={showToast} /> : null}
      {slug === "crm" ? <CrmLive showToast={showToast} /> : null}
      {slug === "ai-studio" ? <AiStudioLive showToast={showToast} /> : null}
      {slug === "analytics" ? <AnalyticsLive /> : null}
      {slug === "settings" ? <StaticNotice title="Settings API" detail="Workspace settings are ready for a future persistence endpoint." /> : null}
      {slug === "license" ? <StaticNotice title="License API" detail="License and billing APIs are not connected in this local MVP yet." /> : null}
    </div>
  );
}

function useApiData<T>(path: string) {
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

function ConnectLive({ showToast }: { showToast: (message: string, tone?: ToastState["tone"]) => void }) {
  const accounts = useApiData<ListResponse<WhatsAppAccount>>("/api/whatsapp/accounts");
  const [form, setForm] = useState({
    label: "ARBCore Official",
    phoneNumber: `018170${String(Date.now()).slice(-5)}`,
    businessName: "ARBCore AI",
    status: "CONNECTED",
    qualityRating: "GOOD",
    dailyLimit: "10000"
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiRequest<WhatsAppAccount>("/api/whatsapp/accounts", {
        method: "POST",
        body: JSON.stringify({ ...form, dailyLimit: Number(form.dailyLimit) })
      });
      showToast("WhatsApp account created.");
      accounts.reload();
      setForm((current) => ({ ...current, phoneNumber: `018170${String(Date.now()).slice(-5)}` }));
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  return (
    <Panel title="Live WhatsApp Accounts">
      <FormGrid onSubmit={submit} submitLabel="Add account">
        <TextInput label="Label" value={form.label} onChange={(value) => setForm({ ...form, label: value })} />
        <TextInput label="Phone number" value={form.phoneNumber} onChange={(value) => setForm({ ...form, phoneNumber: value })} />
        <TextInput label="Business name" value={form.businessName} onChange={(value) => setForm({ ...form, businessName: value })} />
        <SelectInput label="Status" value={form.status} options={["CONNECTED", "PENDING", "DISCONNECTED"]} onChange={(value) => setForm({ ...form, status: value })} />
        <TextInput label="Quality" value={form.qualityRating} onChange={(value) => setForm({ ...form, qualityRating: value })} />
        <TextInput label="Daily limit" value={form.dailyLimit} onChange={(value) => setForm({ ...form, dailyLimit: value })} />
      </FormGrid>
      <DataState loading={accounts.loading} error={accounts.error} empty={!accounts.data?.items.length} emptyText="No WhatsApp accounts yet.">
        <ResponsiveTable
          columns={["Label", "Phone", "Status", "Quality", "Usage"]}
          rows={(accounts.data?.items ?? []).map((account) => [
            account.label,
            account.phoneNumber,
            account.status,
            account.qualityRating,
            `${account.messagesUsed24h} / ${account.dailyLimit}`
          ])}
        />
      </DataState>
    </Panel>
  );
}

function ContactsLive({ showToast }: { showToast: (message: string, tone?: ToastState["tone"]) => void }) {
  const contacts = useApiData<ListResponse<Contact>>("/api/contacts");
  const [detail, setDetail] = useState<Contact | null>(null);
  const [form, setForm] = useState({
    name: "New Customer",
    phone: `018171${String(Date.now()).slice(-5)}`,
    email: "",
    segment: "New Leads",
    stage: "NEW_LEAD"
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiRequest<Contact>("/api/contacts", {
        method: "POST",
        body: JSON.stringify({ ...form, email: form.email || undefined, optedIn: true })
      });
      showToast("Contact created.");
      contacts.reload();
      setForm((current) => ({ ...current, phone: `018171${String(Date.now()).slice(-5)}` }));
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function importDemo() {
    try {
      await apiRequest<{ imported: number }>("/api/contacts/import", {
        method: "POST",
        body: JSON.stringify({
          rows: [
            {
              name: "Imported Contact",
              phone: `018172${String(Date.now()).slice(-5)}`,
              segment: "Imported",
              optedIn: true
            }
          ]
        })
      });
      showToast("Contact import completed.");
      contacts.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function loadDetail(id: string) {
    try {
      const response = await apiRequest<Contact>(`/api/contacts/${id}`);
      setDetail(response);
      showToast("Contact detail loaded.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function markWon(contact: Contact) {
    try {
      await apiRequest<Contact>(`/api/contacts/${contact.id}`, {
        method: "PUT",
        body: JSON.stringify({ stage: "WON" })
      });
      showToast("Contact updated.");
      contacts.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function removeContact(contact: Contact) {
    try {
      await apiRequest<{ deleted: boolean }>(`/api/contacts/${contact.id}`, { method: "DELETE" });
      showToast("Contact deleted.");
      contacts.reload();
      if (detail?.id === contact.id) setDetail(null);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  return (
    <Panel title="Live Contacts">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <FormGrid onSubmit={submit} submitLabel="Add contact" compact>
          <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextInput label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <TextInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <TextInput label="Segment" value={form.segment} onChange={(value) => setForm({ ...form, segment: value })} />
          <SelectInput label="Stage" value={form.stage} options={["NEW_LEAD", "INTERESTED", "FOLLOW_UP", "WON", "LOST"]} onChange={(value) => setForm({ ...form, stage: value })} />
        </FormGrid>
        <button onClick={importDemo} className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-blue-200 px-4 text-sm font-bold text-royal hover:bg-blue-50">
          <Upload className="h-4 w-4" />
          Import demo row
        </button>
      </div>
      {detail ? (
        <div className="mb-4 rounded-[16px] border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-slate-700">
          Selected: {detail.name} - {detail.phone} - {detail.stage}
        </div>
      ) : null}
      <DataState loading={contacts.loading} error={contacts.error} empty={!contacts.data?.items.length} emptyText="No contacts yet.">
        <ActionTable
          columns={["Name", "Phone", "Segment", "Stage", "Actions"]}
          rows={(contacts.data?.items ?? []).map((contact) => ({
            id: contact.id,
            cells: [contact.name, contact.phone, contact.segment ?? "-", contact.stage],
            actions: (
              <div className="flex flex-wrap gap-2">
                <SmallButton onClick={() => loadDetail(contact.id)}>View</SmallButton>
                <SmallButton onClick={() => markWon(contact)}>Mark won</SmallButton>
                <IconButton onClick={() => removeContact(contact)} label="Delete">
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            )
          }))}
        />
      </DataState>
    </Panel>
  );
}

function CampaignsLive({ showToast }: { showToast: (message: string, tone?: ToastState["tone"]) => void }) {
  const campaigns = useApiData<ListResponse<Campaign>>("/api/campaigns");
  const [form, setForm] = useState({
    name: "New Campaign",
    templateName: "Welcome Offer",
    targetSegment: "New Leads",
    messageBody: "Draft message only. Bulk sending is not active."
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiRequest<Campaign>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(form)
      });
      showToast("Campaign draft created.");
      campaigns.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  return (
    <Panel title="Campaign Drafts">
      <FormGrid onSubmit={submit} submitLabel="Create draft">
        <TextInput label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <TextInput label="Template" value={form.templateName} onChange={(value) => setForm({ ...form, templateName: value })} />
        <TextInput label="Target segment" value={form.targetSegment} onChange={(value) => setForm({ ...form, targetSegment: value })} />
        <TextInput label="Message body" value={form.messageBody} onChange={(value) => setForm({ ...form, messageBody: value })} />
      </FormGrid>
      <DataState loading={campaigns.loading} error={campaigns.error} empty={!campaigns.data?.items.length} emptyText="No campaigns yet.">
        <ActionTable
          columns={["Name", "Template", "Segment", "Status", "Phase"]}
          rows={(campaigns.data?.items ?? []).map((campaign) => ({
            id: campaign.id,
            cells: [campaign.name, campaign.templateName, campaign.targetSegment ?? "-", campaign.status],
            actions: <span className="text-xs font-bold text-slate-500">Draft only</span>
          }))}
        />
      </DataState>
    </Panel>
  );
}

function SendMessagesLive({ showToast }: { showToast: (message: string, tone?: ToastState["tone"]) => void }) {
  const logs = useApiData<ListResponse<MessageLog>>("/api/messages/logs");
  const conversations = useApiData<ListResponse<Conversation>>("/api/conversations");
  const [conversationDetail, setConversationDetail] = useState<Conversation | null>(null);
  const [form, setForm] = useState({ contactId: "", subject: "Customer Conversation", body: "Hi, I need help." });
  const [reply, setReply] = useState("Thanks for your message. We will help shortly.");

  async function createConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiRequest<Conversation>("/api/conversations", {
        method: "POST",
        body: JSON.stringify(form)
      });
      showToast("Conversation created.");
      conversations.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function loadConversation(id: string) {
    try {
      const response = await apiRequest<Conversation>(`/api/conversations/${id}`);
      setConversationDetail(response);
      showToast("Conversation loaded.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function sendReply() {
    if (!conversationDetail) return;

    try {
      const message = await apiRequest<ConversationMessage>(`/api/conversations/${conversationDetail.id}`, {
        method: "POST",
        body: JSON.stringify({ body: reply, direction: "OUTBOUND", status: "SENT" })
      });
      setConversationDetail({
        ...conversationDetail,
        messages: [...conversationDetail.messages, message]
      });
      showToast("Conversation reply added.");
      conversations.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Message Logs">
        <DataState loading={logs.loading} error={logs.error} empty={!logs.data?.items.length} emptyText="No message logs yet. Send a campaign to create logs.">
          <ResponsiveTable
            columns={["Contact", "Campaign", "Direction", "Status", "Message"]}
            rows={(logs.data?.items ?? []).map((log) => [
              log.contact?.name ?? "-",
              log.campaign?.name ?? "-",
              log.direction,
              log.status,
              log.body
            ])}
          />
        </DataState>
      </Panel>

      <Panel title="Conversation Inbox">
        <FormGrid onSubmit={createConversation} submitLabel="Create conversation" compact>
          <TextInput label="Contact ID" value={form.contactId} onChange={(value) => setForm({ ...form, contactId: value })} />
          <TextInput label="Subject" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} />
          <TextInput label="Opening message" value={form.body} onChange={(value) => setForm({ ...form, body: value })} />
        </FormGrid>
        <DataState loading={conversations.loading} error={conversations.error} empty={!conversations.data?.items.length} emptyText="No conversations yet.">
          <ActionTable
            columns={["Customer", "Status", "Last message", "Actions"]}
            rows={(conversations.data?.items ?? []).map((conversation) => ({
              id: conversation.id,
              cells: [
                conversation.contact?.name ?? "-",
                conversation.status,
                conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : "-"
              ],
              actions: <SmallButton onClick={() => loadConversation(conversation.id)}>Open</SmallButton>
            }))}
          />
        </DataState>
        {conversationDetail ? (
          <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-black text-ink">{conversationDetail.contact.name}</p>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
              {conversationDetail.messages.map((message) => (
                <div key={message.id} className="rounded-[14px] bg-white p-3 text-xs font-semibold text-slate-600">
                  {message.direction}: {message.body}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input className={inputClassName} value={reply} onChange={(event) => setReply(event.target.value)} />
              <button onClick={sendReply} className={primaryButtonClassName}>Reply</button>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function AutoReplyLive({ showToast }: { showToast: (message: string, tone?: ToastState["tone"]) => void }) {
  const rules = useApiData<ListResponse<AutoReplyRule>>("/api/auto-reply/rules");
  const [form, setForm] = useState({ keyword: "price", response: "Here is our latest price list.", priority: "10", matchMode: "CONTAINS" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiRequest<AutoReplyRule>("/api/auto-reply/rules", {
        method: "POST",
        body: JSON.stringify({ ...form, priority: Number(form.priority), isActive: true })
      });
      showToast("Auto reply rule created.");
      rules.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function toggleRule(rule: AutoReplyRule) {
    try {
      await apiRequest<AutoReplyRule>(`/api/auto-reply/rules/${rule.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !rule.isActive })
      });
      showToast("Rule updated.");
      rules.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function deleteRule(rule: AutoReplyRule) {
    try {
      await apiRequest<{ deleted: boolean }>(`/api/auto-reply/rules/${rule.id}`, { method: "DELETE" });
      showToast("Rule deleted.");
      rules.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  return (
    <Panel title="Live Auto Reply Rules">
      <FormGrid onSubmit={submit} submitLabel="Add rule">
        <TextInput label="Keyword" value={form.keyword} onChange={(value) => setForm({ ...form, keyword: value })} />
        <TextInput label="Response" value={form.response} onChange={(value) => setForm({ ...form, response: value })} />
        <TextInput label="Priority" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} />
        <SelectInput label="Match mode" value={form.matchMode} options={["CONTAINS", "EXACT", "STARTS_WITH"]} onChange={(value) => setForm({ ...form, matchMode: value })} />
      </FormGrid>
      <DataState loading={rules.loading} error={rules.error} empty={!rules.data?.items.length} emptyText="No auto reply rules yet.">
        <ActionTable
          columns={["Keyword", "Response", "Priority", "Status", "Actions"]}
          rows={(rules.data?.items ?? []).map((rule) => ({
            id: rule.id,
            cells: [rule.keyword, rule.response, String(rule.priority), rule.isActive ? "Active" : "Paused"],
            actions: (
              <div className="flex flex-wrap gap-2">
                <SmallButton onClick={() => toggleRule(rule)}>{rule.isActive ? "Pause" : "Activate"}</SmallButton>
                <IconButton onClick={() => deleteRule(rule)} label="Delete">
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            )
          }))}
        />
      </DataState>
    </Panel>
  );
}

function CrmLive({ showToast }: { showToast: (message: string, tone?: ToastState["tone"]) => void }) {
  const pipeline = useApiData<CrmPipelineResponse>("/api/crm/pipeline");
  const contacts = useApiData<ListResponse<Contact>>("/api/contacts");
  const firstContactId = contacts.data?.items[0]?.id ?? "";
  const [form, setForm] = useState({ title: "New CRM Deal", contactId: "", value: "15000", stage: "INTERESTED", owner: "Rasel Ahmed" });

  useEffect(() => {
    if (!form.contactId && firstContactId) {
      setForm((current) => ({ ...current, contactId: firstContactId }));
    }
  }, [firstContactId, form.contactId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiRequest<CrmDeal>("/api/crm/pipeline", {
        method: "POST",
        body: JSON.stringify({ ...form, value: Number(form.value), nextAction: "Follow up" })
      });
      showToast("CRM deal created.");
      pipeline.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  return (
    <Panel title="Live CRM Pipeline">
      <div className="mb-4 grid gap-3 md:grid-cols-5">
        {(pipeline.data?.pipeline ?? []).map((stage) => (
          <div key={stage.stage} className="rounded-[16px] border border-blue-100 bg-blue-50 p-4">
            <p className="truncate text-xs font-black text-royal">{stage.stage}</p>
            <p className="mt-2 text-2xl font-black text-ink">{stage.count}</p>
            <p className="text-xs font-semibold text-slate-500">BDT {stage.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <FormGrid onSubmit={submit} submitLabel="Create deal">
        <TextInput label="Deal title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <TextInput label="Contact ID" value={form.contactId} onChange={(value) => setForm({ ...form, contactId: value })} />
        <TextInput label="Value" value={form.value} onChange={(value) => setForm({ ...form, value: value })} />
        <SelectInput label="Stage" value={form.stage} options={["NEW_LEAD", "INTERESTED", "FOLLOW_UP", "WON", "LOST"]} onChange={(value) => setForm({ ...form, stage: value })} />
        <TextInput label="Owner" value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} />
      </FormGrid>
      <DataState loading={pipeline.loading} error={pipeline.error} empty={!pipeline.data?.deals.length} emptyText="No CRM deals yet.">
        <ResponsiveTable
          columns={["Deal", "Contact", "Stage", "Owner", "Value"]}
          rows={(pipeline.data?.deals ?? []).map((deal) => [
            deal.title,
            deal.contact.name,
            deal.stage,
            deal.owner ?? "-",
            `BDT ${deal.value.toLocaleString()}`
          ])}
        />
      </DataState>
    </Panel>
  );
}

function AiStudioLive({ showToast }: { showToast: (message: string, tone?: ToastState["tone"]) => void }) {
  const [form, setForm] = useState({ customerName: "Sadia", tone: "friendly", context: "catalog request", prompt: "Please send the product catalog." });
  const [result, setResult] = useState<AiGeneration | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest<AiGeneration>("/api/ai/generate-message", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setResult(response);
      showToast("AI message generated.");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Live AI Message Generation">
      <FormGrid onSubmit={submit} submitLabel={loading ? "Generating..." : "Generate"}>
        <TextInput label="Customer" value={form.customerName} onChange={(value) => setForm({ ...form, customerName: value })} />
        <SelectInput label="Tone" value={form.tone} options={["professional", "friendly", "sales", "support"]} onChange={(value) => setForm({ ...form, tone: value })} />
        <TextInput label="Context" value={form.context} onChange={(value) => setForm({ ...form, context: value })} />
        <TextInput label="Prompt" value={form.prompt} onChange={(value) => setForm({ ...form, prompt: value })} />
      </FormGrid>
      {result ? (
        <div className="rounded-[18px] border border-blue-100 bg-blue-50 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <Bot className="h-4 w-4 text-royal" />
            Generated reply
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-700">{result.output}</p>
          <p className="mt-3 text-xs font-semibold text-slate-500">Model: {result.model}</p>
        </div>
      ) : (
        <EmptyState text="Generate a reply to see the mock ARBCore AI response." />
      )}
    </Panel>
  );
}

function AnalyticsLive() {
  const summary = useApiData<AnalyticsSummary>("/api/analytics/summary");
  const totalEntries = useMemo(() => Object.entries(summary.data?.totals ?? {}), [summary.data]);
  const rateEntries = useMemo(() => Object.entries(summary.data?.rates ?? {}), [summary.data]);

  return (
    <Panel title="Live Analytics Summary" action={<RefreshButton onClick={summary.reload} />}>
      <DataState loading={summary.loading} error={summary.error} empty={!summary.data} emptyText="No analytics summary yet.">
        <div className="grid gap-4 lg:grid-cols-2">
          <MetricList title="Totals" entries={totalEntries} />
          <MetricList title="Rates" entries={rateEntries.map(([key, value]) => [key, `${value}%`])} />
        </div>
        {summary.data ? <p className="mt-4 text-xs font-semibold text-slate-500">Generated at {formatDate(summary.data.generatedAt)}</p> : null}
      </DataState>
    </Panel>
  );
}

function StaticNotice({ title, detail }: { title: string; detail: string }) {
  return (
    <Panel title={title}>
      <div className="rounded-[18px] border border-blue-100 bg-blue-50 p-5 text-sm font-semibold text-slate-600">
        {detail}
      </div>
    </Panel>
  );
}

function FormGrid({
  children,
  onSubmit,
  submitLabel,
  compact
}: {
  children: React.ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  compact?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className={cn("mb-5 grid gap-3", compact ? "md:grid-cols-3 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-3")}>
      {children}
      <button className={cn(primaryButtonClassName, "self-end")} type="submit">
        <Plus className="h-4 w-4" />
        {submitLabel}
      </button>
    </form>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-slate-500">
      {label}
      <input className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-slate-500">
      {label}
      <select className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DataState({
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
          Loading API data...
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-[18px] border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center text-sm font-semibold text-slate-500">
      <span>
        <Sparkles className="mx-auto mb-2 h-6 w-6 text-royal" />
        {text}
      </span>
    </div>
  );
}

function ResponsiveTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="soft-scrollbar overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 pb-2 text-xs font-black uppercase text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")} className="bg-blue-50/70">
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`} className={cn("px-4 py-4 text-sm font-semibold text-slate-700 first:rounded-l-[16px] last:rounded-r-[16px]", index === 0 && "font-black text-ink")}>
                  <span className="line-clamp-2">{cell}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionTable({
  columns,
  rows
}: {
  columns: string[];
  rows: Array<{ id: string; cells: string[]; actions: React.ReactNode }>;
}) {
  return (
    <div className="soft-scrollbar overflow-x-auto">
      <table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 pb-2 text-xs font-black uppercase text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="bg-blue-50/70">
              {row.cells.map((cell, index) => (
                <td key={`${row.id}-${cell}-${index}`} className={cn("px-4 py-4 text-sm font-semibold text-slate-700 first:rounded-l-[16px]", index === 0 && "font-black text-ink")}>
                  <span className="line-clamp-2">{cell}</span>
                </td>
              ))}
              <td className="rounded-r-[16px] px-4 py-4">{row.actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricList({ title, entries }: { title: string; entries: Array<[string, number | string]> }) {
  return (
    <div className="rounded-[18px] border border-blue-100 bg-blue-50 p-4">
      <p className="text-sm font-black text-ink">{title}</p>
      <div className="mt-3 grid gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-4 rounded-[14px] bg-white px-3 py-2">
            <span className="text-xs font-bold text-slate-500">{labelize(key)}</span>
            <span className="text-sm font-black text-ink">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-8 items-center gap-2 rounded-full px-3 text-xs font-bold text-royal hover:bg-blue-50">
      <RefreshCw className="h-3.5 w-3.5" />
      Refresh
    </button>
  );
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-9 rounded-[12px] border border-blue-200 bg-white px-3 text-xs font-black text-royal hover:bg-blue-50">
      {children}
    </button>
  );
}

function IconButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button title={label} aria-label={label} onClick={onClick} className="grid h-9 w-9 place-items-center rounded-[12px] border border-blue-200 bg-white text-royal hover:bg-blue-50">
      {children}
    </button>
  );
}

function Toast({ message, tone }: ToastState) {
  return (
    <div className={cn("fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-2 rounded-[16px] px-4 py-3 text-sm font-bold shadow-glow", tone === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
      {tone === "success" ? <Check className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
      {message}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

const inputClassName =
  "h-11 min-w-0 rounded-[14px] border border-blue-100 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100";

const primaryButtonClassName =
  "flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-royal to-electric px-4 text-sm font-bold text-white shadow-glow transition hover:brightness-105";
