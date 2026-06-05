"use client";

import { useEffect, useState } from "react";
import { Bell, Building2, Facebook, Globe2, KeyRound, Lock, Plus, RefreshCw, Save, ShieldCheck, Smartphone, UserCheck, UserMinus, Users } from "lucide-react";
import { AppShell } from "./app-shell";
import { Toast, inputClassName, primaryButtonClassName, secondaryButtonClassName, useToast } from "./saas-page-utils";
import { ApiClientError, apiRequest, getApiErrorMessage } from "@/lib/api-client";

type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "AGENT";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CompanySettingsResponse = {
  businessName?: string | null;
  workspace?: string | null;
  phone?: string | null;
  website?: string | null;
  timezone?: string | null;
  language?: string | null;
  notifications?: {
    failed?: boolean | null;
    hotLeads?: boolean | null;
    hotLead?: boolean | null;
    billing?: boolean | null;
    weekly?: boolean | null;
  } | null;
  whatsappPhoneNumberId?: string | null;
  whatsappAccessToken?: string | null;
  whatsappVerifyToken?: string | null;
  whatsappWebhookUrl?: string | null;
  messengerPageId?: string | null;
  messengerPageAccessToken?: string | null;
  messengerVerifyToken?: string | null;
  messengerWebhookUrl?: string | null;
};
type WhatsAppSettings = {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
};

type MessengerSettings = {
  pageId: string;
  pageAccessToken: string;
  verifyToken: string;
  webhookUrl: string;
};

export function SettingsModulePage() {
  const { toast, showToast } = useToast();
  const [profile, setProfile] = useState({
    businessName: "Welzz Stride",
    workspace: "Enterprise Workspace",
    phone: "01958474577",
    website: "https://www.welzzstride.com",
    timezone: "Asia/Dhaka"
  });
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState({ failed: true, hotLeads: true, billing: true, weekly: false });
  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings>({
    phoneNumberId: "",
    accessToken: "",
    verifyToken: "",
    webhookUrl: ""
  });
  const [messenger, setMessenger] = useState<MessengerSettings>({
    pageId: "",
    pageAccessToken: "",
    verifyToken: "",
    webhookUrl: ""
  });
  const [apiMode, setApiMode] = useState("Mock/local API");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState("");
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "AGENT" as UserRole });
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const [teamActionLoading, setTeamActionLoading] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [creatingMember, setCreatingMember] = useState(false);

  async function loadTeam() {
    setTeamLoading(true);
    setTeamError("");

    try {
      const response = await apiRequest<{ items?: Partial<TeamMember>[] }>("/api/team");
      const members = (response.items ?? []).map(normalizeTeamMember);
      setTeam(members);
      setRoleDrafts(Object.fromEntries(members.map((member) => [member.id, member.role])));
    } catch (error) {
      setTeamError(getApiErrorMessage(error));
    } finally {
      setTeamLoading(false);
    }
  }
async function loadCompanySettings() {
  try {
    const response = await fetch("/api/settings/company");
    const result = await response.json();

    if (!response.ok || !result?.success) {
      showToast("Unable to load company settings. Existing defaults are still available.", "error");
      return;
    }
    const data = (result.data ?? {}) as CompanySettingsResponse;

    setProfile((current) => ({
      businessName: data.businessName ?? current.businessName,
      workspace: data.workspace ?? current.workspace,
      phone: data.phone ?? current.phone,
      website: data.website ?? current.website,
      timezone: data.timezone ?? current.timezone,
    }));
    setWhatsapp({
     phoneNumberId: data.whatsappPhoneNumberId ?? "",
     accessToken: data.whatsappAccessToken ?? "",
     verifyToken: data.whatsappVerifyToken ?? "",
     webhookUrl: data.whatsappWebhookUrl ?? "",
    });
    setMessenger({
      pageId: data.messengerPageId ?? "",
      pageAccessToken: data.messengerPageAccessToken ?? "",
      verifyToken: data.messengerVerifyToken ?? "",
      webhookUrl: data.messengerWebhookUrl ?? "",
    });
    if (data.language) {
      setLanguage(data.language);
    }

    if (data.notifications) {
      setNotifications({
        failed: Boolean(data.notifications.failed),
        hotLeads: Boolean(data.notifications.hotLeads ?? data.notifications.hotLead),
        billing: Boolean(data.notifications.billing),
        weekly: Boolean(data.notifications.weekly),
      });
    }
  } catch (error) {
    console.error("Unable to load company settings", error);
    showToast("Unable to load company settings. Existing defaults are still available.", "error");
  }
}
useEffect(() => {
  loadCompanySettings();
  loadTeam();
}, []);
async function save(section: string) {
  try {
    const normalizedSection = section.toLowerCase();

    if (!profile.businessName.trim()) {
      showToast("Business name is required.", "error");
      return;
    }

    if (!profile.workspace.trim()) {
      showToast("Workspace name is required.", "error");
      return;
    }

    setSavingSection(section);

    const shouldPersist =
  normalizedSection.includes("business") ||
  normalizedSection.includes("profile") ||
  normalizedSection.includes("notification") ||
  normalizedSection.includes("language") ||
  normalizedSection.includes("api") ||
  normalizedSection.includes("whatsapp") ||
  normalizedSection.includes("messenger");
  
    if (shouldPersist) {
      const response = await fetch("/api/settings/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: profile.businessName.trim(),
          workspace: profile.workspace.trim(),
          phone: profile.phone.trim(),
          website: profile.website.trim(),
          timezone: profile.timezone.trim(),
          language,
          notifications: {
            failed: notifications.failed,
            hotLead: notifications.hotLeads,
            billing: notifications.billing,
            weekly: notifications.weekly,
          },
          whatsappPhoneNumberId: whatsapp.phoneNumberId.trim(),
          whatsappAccessToken: whatsapp.accessToken.trim(),
          whatsappVerifyToken: whatsapp.verifyToken.trim(),
          whatsappWebhookUrl: whatsapp.webhookUrl.trim(),
          messengerPageId: messenger.pageId.trim(),
          messengerPageAccessToken: messenger.pageAccessToken.trim(),
          messengerVerifyToken: messenger.verifyToken.trim(),
          messengerWebhookUrl: messenger.webhookUrl.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.code === "PROVIDER_ID_CONFLICT") {
          throw new ApiClientError(
            response.status,
            result.code,
            "This provider ID is already connected to another workspace. Use a unique Meta number/page for each workspace.",
            result.details
          );
        }

        throw new Error(result.error || "Unable to save settings");
      }

      showToast(`${section} saved successfully.`);
      return;
    }

    showToast(`${section} settings saved locally.`);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Unable to save settings.",
      "error"
    );
  } finally {
    setSavingSection(null);
  }
}
  
async function createTeamMember() {
  try {
    const name = newMember.name.trim();
    const email = newMember.email.trim().toLowerCase();

    if (!name || !email) {
      showToast("Name and email are required.", "error");
      return;
    }

    setCreatingMember(true);
    await apiRequest<TeamMember>("/api/team", {
      method: "POST",
      body: JSON.stringify({ ...newMember, name, email }),
    });

    await loadTeam();
    setNewMember({ name: "", email: "", role: "AGENT" as UserRole });

    showToast("Team member created.");
  } catch (error) {
    showToast(getApiErrorMessage(error), "error");
  } finally {
    setCreatingMember(false);
  }
}                         

  async function saveTeamMemberRole(member: TeamMember) {
    const role = roleDrafts[member.id] ?? member.role;

    if (role === member.role) {
      showToast("No role change to save.");
      return;
    }

    try {
      setTeamActionLoading(`role:${member.id}`);
      await apiRequest<TeamMember>(`/api/team/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role })
      });
      showToast(`${member.name || "Unnamed user"}'s role updated.`);
      await loadTeam();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setTeamActionLoading(null);
    }
  }

  async function setMemberActive(member: TeamMember, isActive: boolean) {
    try {
      setTeamActionLoading(`status:${member.id}`);
      await apiRequest<TeamMember>(`/api/team/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive })
      });
      showToast(`${member.name || "Unnamed user"} ${isActive ? "reactivated" : "deactivated"}.`);
      await loadTeam();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setTeamActionLoading(null);
    }
  }

  return (
    <AppShell>
      <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-panel sm:p-7">
        <div className="flex gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-royal to-electric text-white shadow-glow">
            <ShieldCheck className="h-8 w-8" />
          </span>
          <div>
            <p className="text-xs font-black uppercase text-royal">Workspace Settings</p>
            <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Settings</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Configure local MVP preferences, business details, notifications, language, and security placeholders.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel icon={<Building2 className="h-5 w-5" />} title="Business Profile" action={<button className={primaryButtonClassName} onClick={() => save("Business profile")} disabled={savingSection !== null}><Save className="h-4 w-4" />{savingSection === "Business profile" ? "Saving..." : "Save"}</button>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business name" value={profile.businessName} onChange={(value) => setProfile({ ...profile, businessName: value })} />
            <Field label="Workspace" value={profile.workspace} onChange={(value) => setProfile({ ...profile, workspace: value })} />
            <Field label="Customer-facing WhatsApp number" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} />
            <Field label="Website" value={profile.website} onChange={(value) => setProfile({ ...profile, website: value })} />
            <Field label="Timezone" value={profile.timezone} onChange={(value) => setProfile({ ...profile, timezone: value })} />
          </div>
          <div className="mt-4 rounded-[18px] border border-dashed border-blue-200 bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-600">
            This business profile number is customer-facing copy only. ARBCore receives customer messages only on the WhatsApp number connected to the saved Meta Phone Number ID.
          </div>
        </Panel>

        <Panel icon={<Smartphone className="h-5 w-5" />} title="WhatsApp / API Settings" action={<button className={secondaryButtonClassName} onClick={() => save("API")} disabled={savingSection !== null}><KeyRound className="h-4 w-4" />{savingSection === "API" ? "Saving..." : "Save"}</button>}>
          <div className="mb-4 rounded-[18px] border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-600">
            <p className="font-black text-royal">Connected number rule</p>
            <p className="mt-1">Customer messages will be received only on the WhatsApp number connected to this Phone Number ID.</p>
            <p className="mt-1">To use Welzz Stride number 01958474577, this number must be added and verified in Meta WhatsApp Cloud API first.</p>
            <p className="mt-1">Current active customer number is the number selected in Meta for the saved Phone Number ID.</p>
            <p className="mt-1">Each workspace must use a unique WhatsApp Phone Number ID. Settings blocks duplicate provider IDs.</p>
          </div>
          <label className="grid gap-1.5 text-xs font-black text-slate-500">
            API mode
            <select className={inputClassName} value={apiMode} onChange={(event) => setApiMode(event.target.value)}>
              <option>Mock/local API</option>
              <option>WhatsApp Cloud API</option>
              <option>Webhook receive mode</option>
            </select>
            <span className="text-xs font-semibold leading-5 text-slate-500">
              Outbound sending uses Meta WhatsApp Cloud API when a valid Phone Number ID and Access Token are saved.
            </span>
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Phone number ID" value={whatsapp.phoneNumberId} onChange={(value) => setWhatsapp({ ...whatsapp, phoneNumberId: value })} />
            <Field label="Access token" value={whatsapp.accessToken} onChange={(value) => setWhatsapp({ ...whatsapp, accessToken: value })} />
            <Field label="Verify token" value={whatsapp.verifyToken} onChange={(value) => setWhatsapp({ ...whatsapp, verifyToken: value })} />
            <Field label="Webhook URL" value={whatsapp.webhookUrl} onChange={(value) => setWhatsapp({ ...whatsapp, webhookUrl: value })} />
          </div>
          <div className="mt-4 rounded-[18px] border border-dashed border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-slate-600">
            Access tokens are saved only when entered and are not displayed after refresh.
          </div>
        </Panel>

        <Panel icon={<Facebook className="h-5 w-5" />} title="Messenger / Page API Settings" action={<button className={secondaryButtonClassName} onClick={() => save("Messenger")} disabled={savingSection !== null}><KeyRound className="h-4 w-4" />{savingSection === "Messenger" ? "Saving..." : "Save"}</button>}>
          <div className="mb-4 rounded-[18px] border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-600">
            <p className="font-black text-royal">Messenger live setup</p>
            <p className="mt-1">Messenger uses Facebook Page ID and customer PSID, not phone number.</p>
            <p className="mt-1">Real Messenger receive/reply requires Meta Page webhook setup and a valid Page Access Token.</p>
            <p className="mt-1">ARBCore does not claim Messenger sending is active until Meta setup is configured and tested.</p>
            <p className="mt-1">Each workspace must use a unique Messenger Page ID. Settings blocks duplicate provider IDs.</p>
            <p className="mt-2 font-black text-royal">Webhook URL: https://arbcore-swiftconnect.vercel.app/api/messenger/webhook</p>
            <p className="mt-1 font-black text-royal">Recommended verify token example: arbcore_messenger_verify_2026</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Facebook Page ID" value={messenger.pageId} onChange={(value) => setMessenger({ ...messenger, pageId: value })} />
            <Field label="Page Access Token" value={messenger.pageAccessToken} onChange={(value) => setMessenger({ ...messenger, pageAccessToken: value })} />
            <Field label="Messenger Verify Token" value={messenger.verifyToken} onChange={(value) => setMessenger({ ...messenger, verifyToken: value })} />
            <Field label="Messenger Webhook URL" value={messenger.webhookUrl} onChange={(value) => setMessenger({ ...messenger, webhookUrl: value })} />
          </div>
          <div className="mt-4 rounded-[18px] border border-dashed border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-slate-600">
            Page Access Tokens are saved only when entered and are not displayed after refresh.
          </div>
        </Panel>

        <Panel icon={<Bell className="h-5 w-5" />} title="Notification Preferences" action={<button className={primaryButtonClassName} onClick={() => save("Notification")} disabled={savingSection !== null}><Save className="h-4 w-4" />{savingSection === "Notification" ? "Saving..." : "Save"}</button>}>
          <Toggle label="Failed message alerts" checked={notifications.failed} onChange={(checked) => setNotifications({ ...notifications, failed: checked })} />
          <Toggle label="Hot lead alerts" checked={notifications.hotLeads} onChange={(checked) => setNotifications({ ...notifications, hotLeads: checked })} />
          <Toggle label="Billing and license alerts" checked={notifications.billing} onChange={(checked) => setNotifications({ ...notifications, billing: checked })} />
          <Toggle label="Weekly analytics digest" checked={notifications.weekly} onChange={(checked) => setNotifications({ ...notifications, weekly: checked })} />
        </Panel>

        <Panel icon={<Globe2 className="h-5 w-5" />} title="Language Settings" action={<button className={primaryButtonClassName} onClick={() => save("Language")} disabled={savingSection !== null}><Save className="h-4 w-4" />{savingSection === "Language" ? "Saving..." : "Save"}</button>}>
          <div className="grid gap-2 sm:grid-cols-3">
            {["English", "Bangla", "Banglish"].map((item) => (
              <button key={item} className={`h-12 rounded-[14px] border text-sm font-black ${language === item ? "border-royal bg-blue-50 text-royal" : "border-blue-100 bg-white text-slate-600"}`} onClick={() => setLanguage(item)}>
                {item}
              </button>
            ))}
          </div>
        </Panel>

        <Panel icon={<Lock className="h-5 w-5" />} title="Security / Session" action={<button className={secondaryButtonClassName} onClick={() => save("Security")}><ShieldCheck className="h-4 w-4" />Review</button>}>
          <Info label="Session mode" value="Demo cookie auth" />
          <Info label="Current role" value="OWNER" />
          <Info label="Password storage" value="bcryptjs hash" />
          <Info label="OAuth" value="Not enabled for MVP" />
          <Info label="2FA" value="Recommended before production" />
        </Panel>

        <Panel icon={<Users className="h-5 w-5" />} title="Team Members" action={<button className={secondaryButtonClassName} onClick={loadTeam}><RefreshCw className="h-4 w-4" />Refresh</button>}>
          <p className="mb-3 rounded-[16px] bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
            Creating a team member creates a workspace record. Auth invite/login setup may require admin follow-up. At least one active owner must remain in the workspace.
          </p>
          <div className="grid gap-3 rounded-[18px] border border-blue-100 bg-blue-50 p-4 lg:grid-cols-[1fr_1fr_160px_auto]">
            <Field label="Name" value={newMember.name} onChange={(value) => setNewMember({ ...newMember, name: value })} />
            <Field label="Email" value={newMember.email} onChange={(value) => setNewMember({ ...newMember, email: value })} />
            <label className="grid gap-1.5 text-xs font-black text-slate-500">
              Role
              <select className={inputClassName} value={newMember.role} onChange={(event) => setNewMember({ ...newMember, role: event.target.value as UserRole })}>
                {["OWNER", "ADMIN", "MANAGER", "AGENT"].map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <button className={`${primaryButtonClassName} w-full self-end lg:w-auto`} onClick={createTeamMember} disabled={creatingMember}>
              <Plus className="h-4 w-4" />
              {creatingMember ? "Creating..." : "Create"}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-[18px] border border-blue-100">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.2fr_1.4fr_150px_110px_240px] bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
            {teamLoading ? (
              <div className="px-4 py-8 text-center text-sm font-bold text-slate-500">Loading team members...</div>
            ) : teamError ? (
              <div className="px-4 py-8 text-center text-sm font-bold text-red-600">{teamError}</div>
            ) : team.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-bold text-slate-500">No team members yet.</div>
            ) : (
              team.map((member) => {
                const activeOwners = team.filter((item) => item.role === "OWNER" && item.isActive).length;
                const isLastActiveOwner = member.role === "OWNER" && member.isActive && activeOwners <= 1;
                const draftRole = roleDrafts[member.id] ?? member.role;
                const roleChanged = draftRole !== member.role;
                const roleActionLoading = teamActionLoading === `role:${member.id}`;
                const statusActionLoading = teamActionLoading === `status:${member.id}`;

                return (
                  <div key={member.id} className="grid grid-cols-[1.2fr_1.4fr_150px_110px_240px] items-center gap-3 border-t border-blue-100 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-black text-ink">{member.name || "Unnamed user"}</p>
                      {isLastActiveOwner ? <p className="mt-1 text-xs font-bold text-amber-700">Last active owner protected</p> : null}
                    </div>
                    <span className="truncate font-semibold text-slate-500">{member.email}</span>
                    <select
                      className={`${inputClassName} h-10`}
                      value={draftRole}
                      onChange={(event) => setRoleDrafts((current) => ({ ...current, [member.id]: event.target.value as UserRole }))}
                      disabled={!member.isActive || roleActionLoading}
                    >
                      {["OWNER", "ADMIN", "MANAGER", "AGENT"].map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`${secondaryButtonClassName} h-10 px-3`}
                        onClick={() => saveTeamMemberRole(member)}
                        disabled={!member.isActive || !roleChanged || roleActionLoading || (isLastActiveOwner && draftRole !== "OWNER")}
                      >
                        <Save className="h-4 w-4" />
                        {roleActionLoading ? "Saving..." : "Save Role"}
                      </button>
                      {member.isActive ? (
                        <button
                          className={`${secondaryButtonClassName} h-10 px-3`}
                          onClick={() => setMemberActive(member, false)}
                          disabled={statusActionLoading || isLastActiveOwner}
                        >
                          <UserMinus className="h-4 w-4" />
                          {statusActionLoading ? "Saving..." : "Deactivate"}
                        </button>
                      ) : (
                        <button
                          className={`${secondaryButtonClassName} h-10 px-3`}
                          onClick={() => setMemberActive(member, true)}
                          disabled={statusActionLoading}
                        >
                          <UserCheck className="h-4 w-4" />
                          {statusActionLoading ? "Saving..." : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </Panel>
      </section>
      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function Panel({ icon, title, action, children }: { icon: React.ReactNode; title: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-[24px] border border-blue-100 bg-white/95 p-4 shadow-panel sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-blue-50 text-royal ring-1 ring-blue-100">{icon}</span>
          <h2 className="text-lg font-black text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function normalizeTeamMember(member: Partial<TeamMember>): TeamMember {
  return {
    id: member.id ?? crypto.randomUUID(),
    name: member.name ?? "Unnamed user",
    email: member.email ?? "",
    role: member.role ?? "AGENT",
    isActive: member.isActive ?? true,
    createdAt: member.createdAt ?? new Date(0).toISOString(),
    updatedAt: member.updatedAt ?? new Date(0).toISOString()
  };
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-slate-500">
      {label}
      <input className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="mb-3 flex items-center justify-between gap-4 rounded-[16px] bg-blue-50 px-4 py-3 text-sm font-bold text-slate-700">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 flex flex-col gap-1 rounded-[16px] bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="break-words text-sm font-black text-ink">{value}</span>
    </div>
  );
}
