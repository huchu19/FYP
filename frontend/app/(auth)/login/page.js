"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { alertError, btnPrimary, inputClass } from "@/lib/styles";
import { ArrowRightIcon, BookIcon } from "@/components/layout/icons";

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
    <div className="grid min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-shell)] shadow-[var(--shadow-shell)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-[var(--color-primary)] p-10 text-[var(--button-text)] lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-white/12">
            <BookIcon className="h-5 w-5" />
          </div>
          <span className="font-display text-[2rem] font-semibold tracking-[-0.05em]">EduNexus</span>
        </Link>

        <div className="max-w-md">
          <h2 className="font-display text-[clamp(3rem,4.5vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.06em]">
            Welcome back to smarter learning.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[color:rgba(248,243,234,0.76)]">
            Pick up exactly where you left off. Your classrooms, lessons, and progress views are waiting.
          </p>
        </div>

        <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full border border-white/10" />
      </aside>

      <section className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[33rem]">
          <div className="mb-10 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-[var(--color-primary)] text-[var(--button-text)]">
                <BookIcon className="h-5 w-5" />
              </div>
              <span className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">EduNexus</span>
            </Link>
          </div>

          <h1 className="font-display text-[clamp(3rem,5vw,4.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            Sign In
          </h1>
          <p className="mt-3 text-lg text-[var(--text-muted)]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-[var(--color-primary)] transition hover:opacity-80">
              Create one
            </Link>
          </p>

          {loading && <p className="mt-6 text-sm text-[var(--text-faint)]">Checking existing session...</p>}

          <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-base font-medium text-[var(--text-heading)]">Email</span>
              <input
                type="email"
                className={inputClass}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-medium text-[var(--text-heading)]">Password</span>
                <span className="text-sm text-[var(--color-primary)]">Forgot password?</span>
              </div>
              <input
                type="password"
                className={inputClass}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className={alertError}>{error}</p>}

            <button type="submit" className={`mt-2 w-full ${btnPrimary}`} disabled={submitting || loading}>
              {submitting ? "Signing in..." : "Sign In"}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-card)]" />
            <span className="text-sm text-[var(--text-muted)]">or continue with</span>
            <div className="h-px flex-1 bg-[var(--border-card)]" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" className="rounded-[0.95rem] border border-[var(--border-input)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium text-[var(--text-heading)] transition hover:bg-[var(--bg-list)]">
              Google
            </button>
            <button type="button" className="rounded-[0.95rem] border border-[var(--border-input)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium text-[var(--text-heading)] transition hover:bg-[var(--bg-list)]">
              Microsoft
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
