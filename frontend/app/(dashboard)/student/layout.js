"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

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
    return <section className="py-10 text-sm text-slate-600">Checking your student session...</section>;
  }

  return children;
}
