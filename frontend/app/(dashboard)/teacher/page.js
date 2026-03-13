"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { apiGet } from "@/lib/api";

const card = "rounded-xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-md";
const btnPrimary = "rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40";
const btnSecondary = "rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-500/40 hover:text-white";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiGet("/classrooms")
      .then((data) => { if (!cancelled) setClassrooms(data); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load classrooms"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const firstClassroom = classrooms[0] || null;

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href="/">&larr; Home</Link>
        <Link className="transition hover:text-cyan-400" href="/teacher/classrooms/new">Create classroom</Link>
        <Link className="transition hover:text-violet-400" href="/student">Student view</Link>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Dashboard</p>
        <h1 className="text-3xl font-bold text-white">
          {user ? `${user.name}'s Teacher Home` : "Teacher Home"}
        </h1>
        <p className="text-slate-400">Overview of your classrooms, lessons, and insights.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${card} transition hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active classrooms</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {loading ? <span className="animate-pulse">...</span> : classrooms.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">Teacher-owned classrooms</p>
        </div>
        <div className={`${card} transition hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI lessons</p>
          <p className="mt-1 text-3xl font-bold text-slate-600">&mdash;</p>
          <p className="mt-1 text-sm text-slate-500">Available after AI integration</p>
        </div>
        <div className={`${card} transition hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg quiz score</p>
          <p className="mt-1 text-3xl font-bold text-slate-600">&mdash;</p>
          <p className="mt-1 text-sm text-slate-500">Available after analytics integration</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Classrooms</h2>
            <Link className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300" href="/teacher/classrooms/new">+ New</Link>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {loading && <p className="animate-pulse text-slate-500">Loading classrooms...</p>}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && !error && classrooms.length === 0 && (
              <p className="text-slate-500">No classrooms yet. Create one to get started.</p>
            )}
            {!loading && !error && classrooms.length > 0 && (
              <ul className="space-y-2">
                {classrooms.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/teacher/classrooms/${c.id}`}
                      className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2.5 transition hover:bg-slate-800"
                    >
                      <span className="text-slate-200">{c.name}</span>
                      <span className="font-mono text-xs text-slate-500">{c.code}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={card}>
          <h2 className="text-lg font-semibold text-white">AI Lessons</h2>
          <p className="mt-1 text-sm text-slate-400">Generate and publish new lesson plans.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {firstClassroom ? (
              <>
                <Link href={`/teacher/classrooms/${firstClassroom.id}/lessons/new`} className={btnPrimary}>New lesson</Link>
                <Link href={`/teacher/classrooms/${firstClassroom.id}`} className={btnSecondary}>Manage lessons</Link>
              </>
            ) : (
              <Link href="/teacher/classrooms/new" className={btnPrimary}>Create your first classroom</Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
