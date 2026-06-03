"use client";

import { useEffect, useMemo, useState } from "react";
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
  UserRound
} from "lucide-react";
import { apiRequest } from "@/lib/api-client";
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
    email: string | null;
    role: string | null;
  };
};

export function Topbar() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthMe | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const initials = useMemo(() => {
    const name = auth?.user?.name ?? auth?.prismaUser?.email ?? "Admin User";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [auth?.prismaUser?.email, auth?.user?.name]);

  async function logout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-blue-100/80 bg-white/84 backdrop-blur-xl">
      <div className="flex min-h-[100px] items-center gap-4 px-4 py-4 sm:px-6 xl:px-8">
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

        <div className="relative hidden max-w-2xl flex-1 xl:block">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-14 w-full rounded-[18px] border border-blue-100 bg-white px-14 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-royal focus:ring-4 focus:ring-blue-100"
            placeholder="Search contacts, campaigns, messages..."
          />
          <span className="absolute right-4 top-1/2 flex h-8 -translate-y-1/2 items-center gap-1 rounded-lg border border-blue-100 bg-slate-50 px-2 text-xs font-bold text-slate-500">
            <Command className="h-3.5 w-3.5" /> K
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <RobotAvatar size="md" className="hidden sm:grid" />
          <IconButton count={8}>
            <Bell className="h-5 w-5" />
          </IconButton>
          <IconButton count={3}>
            <MessageSquareText className="h-5 w-5" />
          </IconButton>
          <IconButton>
            <CircleHelp className="h-5 w-5" />
          </IconButton>
          <div className="mx-1 hidden h-10 w-px bg-blue-100 md:block" />
          <div className="relative hidden sm:block">
            <button
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-14 items-center gap-3 rounded-[18px] px-3 transition hover:bg-blue-50"
              aria-expanded={menuOpen}
            >
              <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-black text-white">
                {initials}
                <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <span className="hidden min-w-0 text-left xl:block">
                <span className="block truncate text-sm font-bold text-ink">{auth?.user?.name ?? auth?.prismaUser?.email ?? "Rasel Ahmed"}</span>
                <span className="block truncate text-xs font-medium text-slate-500">{auth?.user?.role ?? auth?.prismaUser?.role ?? "Admin"}</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 xl:block" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-[64px] w-72 rounded-[20px] border border-blue-100 bg-white p-3 shadow-panel">
                <div className="rounded-[16px] bg-blue-50 p-3">
                  <p className="flex items-center gap-2 text-sm font-black text-ink">
                    <UserRound className="h-4 w-4 text-royal" />
                    {auth?.user?.name ?? auth?.prismaUser?.email ?? "Rasel Ahmed"}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">{auth?.user?.email ?? auth?.prismaUser?.email ?? "admin@arbcore.ai"}</p>
                  <p className="mt-2 text-xs font-bold text-royal">{auth?.company?.name ?? "ARBCore AI"}</p>
                </div>
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
      <div className="px-4 pb-4 xl:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-12 w-full rounded-[16px] border border-blue-100 bg-white px-12 text-sm font-medium outline-none focus:border-royal focus:ring-4 focus:ring-blue-100"
            placeholder="Search contacts, campaigns, messages..."
          />
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <button className="relative grid h-11 w-11 place-items-center rounded-full border border-transparent text-slate-700 transition hover:border-blue-100 hover:bg-blue-50 hover:text-royal">
      {children}
      {count ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-royal px-1 text-[10px] font-black text-white ring-2 ring-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}
