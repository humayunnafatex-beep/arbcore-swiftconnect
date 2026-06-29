"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  LogOut,
  Command,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Users,
  UserRound
} from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { getRoleGuidance } from "@/lib/role-guidance";
import { RobotAvatar } from "./robot-avatar";

type AuthMe = {
  user?: {
    name: string;
    email: string;
    role: string;
  };
  company?: {
    name: string;
    plan: string;
  };
  prismaUser?: {
    name?: string | null;
    email: string | null;
    role: string | null;
  };
};

type DashboardAttention = {
  unreadConversations?: number;
  failedMessages?: number;
  overdueFollowUps?: number;
  todayFollowUps?: number;
};

export function Topbar() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthMe | null>(null);
  const [stats, setStats] = useState<DashboardAttention>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    apiRequest<AuthMe>("/api/auth/me")
      .then((data) => {
        if (active) setAuth(data);
      })
      .catch(() => {
        if (active) setAuth(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      try {
        const data = await apiRequest<AuthMe>("/api/auth/me");
        if (active) setAuth(data);
      } catch {
        if (active) setAuth(null);
      }
    }

    window.addEventListener("arbcore:profile-updated", loadAuth);

    return () => {
      active = false;
      window.removeEventListener("arbcore:profile-updated", loadAuth);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const data = await apiRequest<DashboardAttention>("/api/dashboard/attention");
        if (active) setStats(data);
      } catch {
        // Keep the last known badge counts if a background refresh fails.
      }
    }

    void loadStats();
    const interval = window.setInterval(loadStats, 300000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadStats();
      }
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const initials = useMemo(() => {
    const name = auth?.user?.name ?? auth?.prismaUser?.name ?? auth?.prismaUser?.email ?? "Admin User";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [auth?.prismaUser?.email, auth?.prismaUser?.name, auth?.user?.name]);

  const role = auth?.user?.role ?? auth?.prismaUser?.role ?? "OWNER";
  const roleCode = role.toUpperCase();
  const guidance = getRoleGuidance(role);
  const notificationCount = (stats.overdueFollowUps ?? 0) + (stats.todayFollowUps ?? 0);
  const messageCount = (stats.unreadConversations ?? 0) + (stats.failedMessages ?? 0);
  const notificationHref = (stats.overdueFollowUps ?? 0) > 0
    ? "/follow-ups?status=OVERDUE"
    : (stats.todayFollowUps ?? 0) > 0
      ? "/follow-ups?status=TODAY"
      : "/follow-ups";
  const messageHref = (stats.unreadConversations ?? 0) > 0
    ? "/inbox"
    : (stats.failedMessages ?? 0) > 0
      ? "/message-logs?status=FAILED"
      : "/inbox";

  async function logout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-blue-100/80 bg-white/84 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center gap-3 px-3 py-3 sm:min-h-[100px] sm:gap-4 sm:px-6 sm:py-4 xl:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <RobotAvatar size="sm" />
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-royal">ARBCore</p>
            <p className="truncate text-sm font-bold text-royal">SwiftConnect</p>
          </div>
        </div>

        <button className="hidden h-14 min-w-[290px] items-center justify-between gap-4 rounded-[18px] border border-blue-100 bg-white px-4 shadow-sm transition hover:border-blue-200 md:flex">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-blue-50 text-royal ring-1 ring-blue-100">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-bold text-ink">{auth?.company?.name ?? "ARBCore AI"}</span>
              <span className="block truncate text-xs font-medium text-slate-500">{auth?.company?.plan ?? "Enterprise"} Workspace</span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        </button>

        <form className="relative hidden max-w-2xl flex-1 xl:block" onSubmit={submitSearch}>
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-14 w-full rounded-[18px] border border-blue-100 bg-white px-14 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100"
            placeholder="Search inbox, contacts, orders, products..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search workspace"
          />
          <span className="absolute right-4 top-1/2 flex h-8 -translate-y-1/2 items-center gap-1 rounded-lg border border-blue-100 bg-slate-50 px-2 text-xs font-bold text-slate-500">
            <Command className="h-3.5 w-3.5" /> Enter
          </span>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <RobotAvatar size="md" className="hidden sm:grid" />
          <IconButton count={notificationCount} label="Open follow-up notifications" title="Follow-ups needing attention" href={notificationHref}>
            <Bell className="h-5 w-5" />
          </IconButton>
          <IconButton count={messageCount} label="Open inbox messages" title="Unread conversations / failed messages" href={messageHref}>
            <MessageSquareText className="h-5 w-5" />
          </IconButton>
          <IconButton label="Help & Guide" title="Help & Guide" href="/license">
            <CircleHelp className="h-5 w-5" />
          </IconButton>
          <div className="mx-1 hidden h-10 w-px bg-blue-100 md:block" />
          <div className="relative">
            <button
              onClick={() => setMenuOpen((current) => !current)}
              className="flex min-h-12 items-center gap-2 rounded-[18px] px-2 transition hover:bg-blue-50 sm:min-h-14 sm:gap-3 sm:px-3"
              aria-expanded={menuOpen}
            >
              <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-black text-white sm:h-11 sm:w-11 sm:text-sm">
                {initials}
                <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <span className="hidden min-w-0 text-left lg:block">
                <span className="block truncate text-sm font-bold text-ink">{auth?.user?.name ?? auth?.prismaUser?.name ?? auth?.prismaUser?.email ?? "Rasel Ahmed"}</span>
                <span className="mt-1 inline-flex rounded-full bg-royal px-2.5 py-1 text-[10px] font-black uppercase text-white ring-1 ring-blue-100">{roleCode}</span>
              </span>
              <span className="rounded-full bg-royal px-2 py-1 text-[10px] font-black uppercase text-white lg:hidden">{roleCode}</span>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-[58px] w-[calc(100vw-24px)] max-w-[340px] rounded-[20px] border border-blue-100 bg-white p-3 shadow-panel sm:top-[64px]">
                <div className="rounded-[16px] bg-blue-50 p-3">
                  <p className="flex items-center gap-2 text-sm font-black text-ink">
                    <UserRound className="h-4 w-4 text-royal" />
                    {auth?.user?.name ?? auth?.prismaUser?.name ?? auth?.prismaUser?.email ?? "Rasel Ahmed"}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">{auth?.user?.email ?? auth?.prismaUser?.email ?? "admin@arbcore.ai"}</p>
                  <p className="mt-2 text-xs font-bold text-royal">{auth?.company?.name ?? "ARBCore AI"}</p>
                  <div className="mt-3 inline-flex rounded-full bg-royal px-3 py-1.5 text-[11px] font-black uppercase text-white">
                    Current role: {roleCode}
                  </div>
                  <div className="mt-3 rounded-[12px] border border-blue-100 bg-white px-3 py-2">
                    <p className="text-xs font-black text-ink">{guidance.label} guidance</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{guidance.focus}</p>
                    <p className="mt-2 text-[11px] font-bold text-amber-700">UI guidance only. Permission enforcement remains off for beta.</p>
                  </div>
                </div>
                <div className="mt-2 grid gap-1">
                  <MenuLink href="/settings#account-profile" icon={<Settings className="h-4 w-4" />} label="Account / Profile" onClick={() => setMenuOpen(false)} />
                  <MenuLink href="/settings#team-members" icon={<Users className="h-4 w-4" />} label="Manage Team Members" onClick={() => setMenuOpen(false)} />
                  <MenuLink href="/settings#team-members" icon={<ShieldCheck className="h-4 w-4" />} label="Role & Access / Team Roles" onClick={() => setMenuOpen(false)} />
                </div>
                <p className="mt-2 rounded-[14px] bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
                  To change user roles, go to Settings - Team Members. Owner guidance is informational; role actions live in Team Members.
                </p>
                <button
                  onClick={logout}
                  className="mt-2 flex h-11 w-full items-center gap-2 rounded-[14px] px-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="hidden px-3 pb-3 sm:block sm:px-6 sm:pb-4 xl:hidden">
        <form className="relative" onSubmit={submitSearch}>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-12 w-full rounded-[16px] border border-blue-100 bg-white px-12 text-sm font-medium outline-none focus:border-royal focus:ring-4 focus:ring-blue-100"
            placeholder="Search inbox, contacts, orders, products..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search workspace"
          />
        </form>
      </div>
    </header>
  );
}

function IconButton({ children, count, label, title, href }: { children: React.ReactNode; count?: number; label: string; title?: string; href?: string }) {
  const content = (
    <>
      <span className="sr-only">{label}</span>
      {label === "Help & Guide" ? <span className="text-xs font-black">Help</span> : children}
      {count ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-royal px-1 text-[10px] font-black text-white ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </>
  );
  const className = label === "Help & Guide"
    ? "relative inline-flex h-11 items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-3 text-xs font-black text-royal transition hover:bg-blue-100 sm:w-auto"
    : "relative grid h-11 w-11 place-items-center rounded-full border border-transparent text-slate-700 transition hover:border-blue-100 hover:bg-blue-50 hover:text-royal";

  if (href) {
    return <Link href={href} className={className} title={title ?? label}>{content}</Link>;
  }

  return (
    <button className={className} title={title ?? label} aria-label={label}>
      {content}
    </button>
  );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex h-11 items-center gap-2 rounded-[14px] px-3 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-royal">
      {icon}
      {label}
    </Link>
  );
}
