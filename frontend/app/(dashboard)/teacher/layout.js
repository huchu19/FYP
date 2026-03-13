"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

export default function TeacherLayout({ children }) {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "teacher") {
      router.replace(user.role === "student" ? "/student" : "/");
    }
  }, [loading, router, user]);

  if (loading || !user || user.role !== "teacher") {
    return <section className="py-10 text-sm text-slate-600">Checking your teacher session...</section>;
  }

  return children;
}
