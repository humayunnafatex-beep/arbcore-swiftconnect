"use client";

import { useEffect, useState } from "react";
import { Bell, Building2, Facebook, Globe2, KeyRound, Lock, Plus, RefreshCw, Save, ShieldCheck, Smartphone, UserMinus, Users } from "lucide-react";
import { AppShell } from "./app-shell";
import { Toast, inputClassName, primaryButtonClassName, secondaryButtonClassName, useToast } from "./saas-page-utils";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";

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
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [creatingMember, setCreatingMember] = useState(false);

  async function loadTeam() {
    setTeamLoading(true);
    setTeamError("");

    try {
      const response = await apiRequest<{ items: TeamMember[] }>("/api/team");
      setTeam(response.items);
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

    if (!response.ok || !result.success) {
      return;
    }

    setProfile({
      businessName: result.data.businessName || profile.businessName,
      workspace: result.data.workspace || profile.workspace,
      phone: result.data.phone || profile.phone,
      website: result.data.website || profile.website,
      timezone: result.data.timezone || profile.timezone,
    });
    setWhatsapp({
     phoneNumberId: result.data.whatsappPhoneNumberId || "",
     accessToken: result.data.whatsappAccessToken || "",
     verifyToken: result.data.whatsappVerifyToken || "",
     webhookUrl: result.data.whatsappWebhookUrl || "",
    });
    setMessenger({
      pageId: result.data.messengerPageId || "",
      pageAccessToken: result.data.messengerPageAccessToken || "",
      verifyToken: result.data.messengerVerifyToken || "",
      webhookUrl: result.data.messengerWebhookUrl || "",
    });
    if (result.data.language) {
      setLanguage(result.data.language);
    }

    if (result.data.notifications) {
      setNotifications({
        failed: Boolean(result.data.notifications.failed),
        hotLeads: Boolean(result.data.notifications.hotLeads ?? result.data.notifications.hotLead),
        billing: Boolean(result.data.notifications.billing),
        weekly: Boolean(result.data.notifications.weekly),
      });
    }
  } catch (error) {
    console.error("Unable to load company settings", error);
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

  async function changeRole(member: TeamMember, role: UserRole) {
    try {
      await apiRequest<TeamMember>(`/api/team/${member.id}`, {
        method: "PUT",
        body: JSON.stringify({ role })
      });
      showToast(`${member.name}'s role updated.`);
      await loadTeam();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function deactivateMember(member: TeamMember) {
    try {
      await apiRequest<TeamMember>(`/api/team/${member.id}/deactivate`, {
        method: "PATCH"
      });
      showToast(`${member.name} deactivated.`);
      await loadTeam();
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
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
          </div>
          <label className="grid gap-1.5 text-xs font-black text-slate-500">
            API mode
            <select className={inputClassName} value={apiMode} onChange={(event) => setApiMode(event.target.value)}>
              <option>Mock/local API</option>
              <option disabled>WhatsApp Cloud API - planned</option>
              <option disabled>Webhook production mode - planned</option>
            </select>
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
            <p className="font-black text-royal">Messenger foundation</p>
            <p className="mt-1">Messenger support is foundation-ready. Real Messenger receive/reply requires Meta Page webhook setup and Page Access Token.</p>
            <p className="mt-1">ARBCore does not claim Messenger sending is active until Meta setup is configured and tested.</p>
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
            <button className={`${primaryButtonClassName} self-end`} onClick={createTeamMember} disabled={creatingMember}>
              <Plus className="h-4 w-4" />
              {creatingMember ? "Creating..." : "Create"}
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[18px] border border-blue-100">
            <div className="grid grid-cols-[1.3fr_1.4fr_150px_110px_120px] bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {teamLoading ? (
              <div className="px-4 py-8 text-center text-sm font-bold text-slate-500">Loading team members...</div>
            ) : teamError ? (
              <div className="px-4 py-8 text-center text-sm font-bold text-red-600">{teamError}</div>
            ) : team.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-bold text-slate-500">No team members yet.</div>
            ) : (
              team.map((member) => (
                <div key={member.id} className="grid grid-cols-[1.3fr_1.4fr_150px_110px_120px] items-center gap-3 border-t border-blue-100 px-4 py-3 text-sm">
                  <span className="font-black text-ink">{member.name}</span>
                  <span className="truncate font-semibold text-slate-500">{member.email}</span>
                  <select className={`${inputClassName} h-10`} value={member.role} onChange={(event) => changeRole(member, event.target.value as UserRole)} disabled={!member.isActive}>
                    {["OWNER", "ADMIN", "MANAGER", "AGENT"].map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                  <button className={`${secondaryButtonClassName} justify-center`} onClick={() => deactivateMember(member)} disabled={!member.isActive}>
                    <UserMinus className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Panel>
      </section>
      {toast ? <Toast {...toast} /> : null}
    </AppShell>
  );
}

function Panel({ icon, title, action, children }: { icon: React.ReactNode; title: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-blue-100 bg-white/95 p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
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
    <div className="mb-3 flex items-center justify-between gap-3 rounded-[16px] bg-blue-50 px-4 py-3">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-sm font-black text-ink">{value}</span>
    </div>
  );
}
