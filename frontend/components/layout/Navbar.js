"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

export default function Navbar() {
  const router = useRouter();
  const { loading, logout, user } = useAuth();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-900/80 px-5 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/20">
          <span className="text-sm font-bold text-white">EN</span>
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-base font-bold text-transparent">EduNexus</h1>
          {user && (
            <p className="text-xs text-slate-400">
              {user.name} &middot; <span className="capitalize">{user.role}</span>
            </p>
          )}
        </div>
      </div>
      <nav className="flex flex-wrap items-center gap-1 text-sm font-medium text-slate-400">
        <Link className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-cyan-400" href="/">Home</Link>
        {!loading && !user && (
          <>
            <Link className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-cyan-400" href="/login">Login</Link>
            <Link className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-1.5 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40" href="/register">Register</Link>
          </>
        )}
        {!loading && user?.role === "teacher" && (
          <>
            <Link className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-cyan-400" href="/teacher">Dashboard</Link>
            <Link className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-cyan-400" href="/teacher/classrooms/new">+ Classroom</Link>
          </>
        )}
        {!loading && user?.role === "student" && (
          <Link className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-cyan-400" href="/student">Dashboard</Link>
        )}
        {!loading && user && (
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-left transition hover:bg-red-500/10 hover:text-red-400"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
