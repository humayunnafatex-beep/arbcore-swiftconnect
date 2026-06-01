"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { RobotAvatar } from "@/components/robot-avatar";
import { apiRequest, getApiErrorMessage } from "@/lib/api-client";
import { createSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@arbcore.ai");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [supabaseAuthenticated, setSupabaseAuthenticated] = useState(false);
  const supabaseConfigured = isSupabaseBrowserConfigured();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setSupabaseAuthenticated(Boolean(data.user));
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (supabaseConfigured) {
        const supabase = createSupabaseBrowserClient();
        const result = await supabase?.auth.signInWithPassword({ email, password });
        if (result?.error) throw result.error;

        router.push("/");
        router.refresh();
        return;
      }

      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      router.push("/");
      router.refresh();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setMagicLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setNotice("Supabase Auth is not configured yet. Use demo access for Enterprise Beta.");
        return;
      }

      const origin = window.location.origin;
      const result = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/callback` }
      });

      if (result.error) throw result.error;
      setNotice("Magic link sent. Check your email to continue.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send magic link.");
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-blue-100 bg-white/92 shadow-panel backdrop-blur lg:grid-cols-[1fr_420px]">
        <div className="relative min-h-[560px] overflow-hidden bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-8 sm:p-12">
          <div className="absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute bottom-[-90px] left-[-70px] h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-4">
                <RobotAvatar size="lg" />
                <div>
                  <p className="text-3xl font-black leading-8 text-royal">ARBCore</p>
                  <p className="text-2xl font-bold leading-7 text-royal">SwiftConnect</p>
                </div>
              </div>
              <div className="mt-14 max-w-2xl">
                <p className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-black uppercase text-royal ring-1 ring-blue-100">
                  <Sparkles className="h-4 w-4" />
                  Enterprise Beta Access
                </p>
                <h1 className="mt-5 text-4xl font-black tracking-normal text-ink sm:text-5xl">
                  Sign in to your WhatsApp automation workspace
                </h1>
                <p className="mt-5 text-base leading-8 text-slate-600">
                  Manage contacts, WhatsApp automation, logs, CRM pipeline, and ARBCore AI tools while SaaS authentication is prepared safely.
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              {["Workspace protected", "Demo admin ready", "API scoped locally"].map((item) => (
                <div key={item} className="rounded-[18px] border border-blue-100 bg-white/80 p-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <p className="mt-3 text-sm font-black text-ink">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-black text-ink">Welcome back</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Login is being prepared for SaaS mode. Use the same email as your ARBCore team user so Supabase Auth can map you to the correct workspace. Current Enterprise Beta may still use demo access while AUTH_ENFORCED=false.</p>
            {supabaseAuthenticated ? (
              <button className="mt-3 text-sm font-black text-royal" onClick={() => router.push("/")}>
                You are signed in. Go to dashboard
              </button>
            ) : null}
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-xs font-black uppercase text-slate-500">
              Email
              <span className="mt-2 flex h-12 items-center gap-3 rounded-[16px] border border-blue-100 bg-white px-4 focus-within:border-royal focus-within:ring-4 focus-within:ring-blue-100">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </span>
            </label>

            <label className="block text-xs font-black uppercase text-slate-500">
              Password
              <span className="mt-2 flex h-12 items-center gap-3 rounded-[16px] border border-blue-100 bg-white px-4 focus-within:border-royal focus-within:ring-4 focus-within:ring-blue-100">
                <LockKeyhole className="h-5 w-5 text-slate-400" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </span>
            </label>

            {error ? (
              <div className="rounded-[16px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="rounded-[16px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {notice}
              </div>
            ) : null}

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-royal to-electric text-sm font-black text-white shadow-glow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in..." : supabaseConfigured ? "Sign in" : "Demo sign in"}
            </button>

            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-blue-200 bg-white text-sm font-black text-royal transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => void sendMagicLink()}
              disabled={magicLoading}
            >
              <Mail className="h-4 w-4" />
              {magicLoading ? "Sending..." : "Send magic link"}
            </button>
          </form>

          <div className="mt-6 rounded-[16px] bg-blue-50 p-4 text-sm font-semibold text-slate-600">
            <p>Email: admin@arbcore.ai</p>
            <p>Password: demo1234</p>
            <p className="mt-2">Dashboard remains available during auth preparation. Supabase users are mapped by auth ID first, then matching email.</p>
          </div>

          <button className="mt-4 text-sm font-black text-royal" onClick={() => router.push("/")}>
            Back to dashboard
          </button>
        </div>
      </section>
    </main>
  );
}
