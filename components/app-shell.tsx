"use client";

import dynamic from "next/dynamic";
import { MobileNav, Sidebar } from "./sidebar";

const Topbar = dynamic(() => import("./topbar").then((mod) => mod.Topbar), {
  ssr: false
});

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="lg:ml-[280px]">
        <Topbar />
        <MobileNav />
        <main className="min-w-0 space-y-5 px-3 py-4 sm:px-6 sm:py-5 xl:px-8">
          {children}
          <div className="rounded-[16px] border border-blue-100 bg-white/80 px-4 py-3 text-center text-xs font-semibold text-slate-500 shadow-sm">
            WhatsApp - 01817030127 | Copyright 2026 ARBCore AI. All rights reserved.
          </div>
        </main>
      </div>
    </div>
  );
}
