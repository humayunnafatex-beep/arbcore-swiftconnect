"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  Cable,
  ClipboardList,
  ContactRound,
  CreditCard,
  DatabaseBackup,
  Home,
  Inbox,
  MessageCircle,
  MessageSquareQuote,
  MessagesSquare,
  Megaphone,
  PackageOpen,
  Send,
  Settings,
  ShoppingBag,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RobotAvatar } from "./robot-avatar";

const navigation = [
  { label: "Dashboard", icon: Home, href: "/" },
  { label: "Connect", icon: MessageCircle, href: "/connect" },
  { label: "Channel Center", icon: Cable, href: "/channels" },
  { label: "Inbox", icon: Inbox, href: "/inbox" },
  { label: "Contacts", icon: ContactRound, href: "/contacts" },
  { label: "Products", icon: PackageOpen, href: "/products" },
  { label: "Orders", icon: ShoppingBag, href: "/orders" },
  { label: "Campaigns", icon: Send, href: "/campaigns" },
  { label: "Send Messages", icon: MessagesSquare, href: "/send-messages" },
  { label: "Saved Replies", icon: MessageSquareQuote, href: "/saved-replies" },
  { label: "Message Logs", icon: ClipboardList, href: "/message-logs" },
  { label: "Data Exports", icon: DatabaseBackup, href: "/exports" },
  { label: "AI Studio", icon: Bot, href: "/ai-studio", badge: "AI" },
  { label: "Auto Reply", icon: BriefcaseBusiness, href: "/auto-reply" },
  { label: "CRM", icon: Megaphone, href: "/crm" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Billing", icon: CreditCard, href: "/billing" },
  { label: "Admin Workspaces", icon: Building2, href: "/admin/workspaces" },
  { label: "License", icon: ShieldCheck, href: "/license" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-blue-100/80 bg-white/88 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex h-[100px] items-center gap-3 border-b border-blue-100/70 px-7">
        <RobotAvatar size="md" />
        <div className="min-w-0">
          <p className="truncate text-2xl font-black leading-7 text-royal">ARBCore</p>
          <p className="truncate text-xl font-bold leading-6 text-royal">SwiftConnect</p>
        </div>
      </div>

      <nav className="soft-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {navigation.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-12 w-full items-center gap-3 rounded-[14px] px-4 text-sm font-semibold transition",
              active
                ? "bg-gradient-to-r from-royal to-electric text-white shadow-glow"
                : "text-slate-700 hover:bg-blue-50 hover:text-royal"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  "rounded-lg px-2 py-1 text-xs ring-1",
                  active ? "bg-white/20 text-white ring-white/20" : "bg-blue-100 text-royal ring-blue-100"
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
          );
        })}
      </nav>

      <div className="p-5">
        <div className="rounded-[22px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-4 shadow-panel">
          <div className="flex items-center gap-3">
            <RobotAvatar size="lg" className="shadow-none" />
            <div>
              <p className="text-sm font-bold text-ink">Need help?</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Your AI assistant is ready to help you.</p>
            </div>
          </div>
          <button className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-royal to-electric text-sm font-bold text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
            Chat with ARBI
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="soft-scrollbar flex gap-2 overflow-x-auto border-b border-blue-100 bg-white/82 px-4 py-3 backdrop-blur lg:hidden">
      {navigation.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
        <Link
          key={item.label}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-bold",
            active ? "bg-royal text-white shadow-glow" : "bg-blue-50 text-slate-700"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
        );
      })}
    </div>
  );
}
