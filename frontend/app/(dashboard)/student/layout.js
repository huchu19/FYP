"use client";

import { useEffect } from "react";
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
      return;
    }
    if (user.role !== "student") {
      router.replace(user.role === "teacher" ? "/teacher" : "/");
    }
  }, [loading, router, user]);

  if (loading || !user || user.role !== "student") {
    return <section className="p-10 text-sm text-[var(--text-faint)]">Checking your student session...</section>;
  }

  return <DashboardFrame role="student">{children}</DashboardFrame>;
}
