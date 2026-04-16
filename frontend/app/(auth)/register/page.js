"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { apiPost } from "@/lib/api";
import { alertError, btnPrimary, inputClass } from "@/lib/styles";
import { ArrowRightIcon, BookIcon } from "@/components/layout/icons";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, login, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    router.replace(user.role === "teacher" ? "/teacher" : "/student");
  }, [loading, router, user]);

  useEffect(() => {
    const requestedRole = searchParams.get("role");
    if (requestedRole === "teacher" || requestedRole === "student") {
      setRole(requestedRole);
    }
  }, [searchParams]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/auth/register", { name, email, password, role });
      const me = await login({ email, password });
      router.push(me.role === "teacher" ? "/teacher" : "/student");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  const submitClass = role === "teacher"
    ? btnPrimary
    : "inline-flex w-full items-center justify-center gap-2 rounded-[0.95rem] border border-[var(--color-accent)]/24 bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--text-heading)] shadow-[var(--shadow-accent)] transition duration-300 hover:-translate-y-0.5";

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
            Begin your journey with adaptive learning.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[color:rgba(248,243,234,0.76)]">
            Create your account and start building, reviewing, or exploring intelligent learning experiences.
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
            Create Account
          </h1>
          <p className="mt-3 text-lg text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--color-primary)] transition hover:opacity-80">
              Sign in
            </Link>
          </p>

          {loading && <p className="mt-6 text-sm text-[var(--text-faint)]">Checking existing session...</p>}

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`rounded-[1rem] border px-4 py-5 text-center transition ${
                role === "teacher"
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                  : "border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--color-primary)]/24"
              }`}
            >
              <span className="block text-base font-medium">Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`rounded-[1rem] border px-4 py-5 text-center transition ${
                role === "student"
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-[var(--shadow-soft)]"
                  : "border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--color-accent)]/24"
              }`}
            >
              <span className="block text-base font-medium">Student</span>
            </button>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-base font-medium text-[var(--text-heading)]">Full Name</span>
              <input
                type="text"
                className={inputClass}
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

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
              <span className="text-base font-medium text-[var(--text-heading)]">Password</span>
              <input
                type="password"
                className={inputClass}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className={alertError}>{error}</p>}

            <button type="submit" className={submitClass} disabled={submitting || loading}>
              {submitting ? "Creating..." : `Create ${role === "teacher" ? "Teacher" : "Student"} Account`}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm leading-7 text-[var(--text-muted)]">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  );
}
