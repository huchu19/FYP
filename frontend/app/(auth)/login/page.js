"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { loading, login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    router.replace(user.role === "teacher" ? "/teacher" : "/student");
  }, [loading, router, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const me = await login({ email, password });
      router.push(me.role === "teacher" ? "/teacher" : "/student");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-16">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href="/">&larr; Home</Link>
        <Link className="transition hover:text-cyan-400" href="/register">Need an account?</Link>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 backdrop-blur-md">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Auth</p>
          <h1 className="text-3xl font-bold text-white">Login</h1>
          <p className="text-sm text-slate-400">Access your EduNexus classroom and tools.</p>
        </header>

        {loading && <p className="mt-4 text-sm text-slate-500 animate-pulse">Checking existing session...</p>}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">Email</span>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">Password</span>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 disabled:opacity-60 disabled:shadow-none"
            disabled={submitting || loading}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
