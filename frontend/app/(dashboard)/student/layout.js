"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import DashboardFrame from "@/components/layout/DashboardFrame";

export default function StudentLayout({ children }) {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
    // Teachers are allowed through in preview mode — no redirect
  }, [loading, router, user]);

  if (loading || !user) {
    return <section className="p-10 text-sm text-[var(--text-faint)]">Checking your session...</section>;
  }

  if (user.role === "teacher") {
    const banner = (
      <div className="flex shrink-0 items-center justify-between gap-4 rounded-[1rem] bg-[var(--color-primary)] px-5 py-2.5">
        <p className="text-sm font-medium text-white">
          Teacher Preview — you&apos;re viewing the student experience
        </p>
        <Link
          href="/teacher"
          className="shrink-0 text-sm font-medium text-white/80 underline hover:text-white"
        >
          Back to Dashboard
        </Link>
      </div>
    );
    return <DashboardFrame role="student" banner={banner}>{children}</DashboardFrame>;
  }

  return <DashboardFrame role="student">{children}</DashboardFrame>;
}
