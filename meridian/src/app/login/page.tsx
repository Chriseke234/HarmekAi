"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Compass, Lock, Mail, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatusMessage(
        "Supabase credentials not yet added to .env.local — you can explore all public & demo workspaces immediately.",
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setStatusMessage(
      error ? error.message : "Signed in successfully. Redirecting to your workspace...",
    );
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sign in to Meridian</h1>
            <p className="text-xs text-slate-500">
              Passwordless-ready · Supabase Auth
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
              Work or personal email
            </label>
            <div className="relative mt-1">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <div className="relative mt-1">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          </div>

          {statusMessage && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-900">
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
          <span>No pre-checked tracking boxes. Full control over your visibility.</span>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          New to Meridian?{" "}
          <Link href="/signup" className="font-semibold text-teal-700 hover:underline">
            Create your Proof-of-Work profile
          </Link>
        </p>
      </div>
    </div>
  );
}
