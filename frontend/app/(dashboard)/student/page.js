"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { apiGet, apiPost } from "@/lib/api";

const card = "rounded-xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-md";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState({ message: "", kind: "" });
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet("/classrooms"),
      apiGet("/gamification/me").catch(() => null),
    ])
      .then(([classroomsData, gamData]) => {
        if (!cancelled) { setClassrooms(classroomsData); setGamification(gamData); }
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load data"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleJoin(e) {
    e.preventDefault();
    setJoinStatus({ message: "", kind: "" });
    setJoining(true);
    try {
      const classroom = await apiPost("/classrooms/join", { code: joinCode });
      setClassrooms((prev) => [...prev, classroom]);
      setJoinCode("");
      setJoinStatus({ message: `Joined ${classroom.name}!`, kind: "success" });
    } catch (err) {
      setJoinStatus({ message: err.message || "Failed to join", kind: "error" });
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href="/">&larr; Home</Link>
        <Link className="transition hover:text-violet-400" href="/teacher">Teacher view</Link>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Dashboard</p>
        <h1 className="text-3xl font-bold text-white">
          {user ? `Welcome back, ${user.name}` : "Welcome back, learner"}
        </h1>
        <p className="text-slate-400">Track your streak, XP, and classrooms.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${card} transition hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">XP</p>
          <p className="mt-1 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-3xl font-bold text-transparent">
            {loading ? "..." : gamification?.xp ?? 0}
          </p>
        </div>
        <div className={`${card} transition hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Badges</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {gamification?.badges?.length > 0 ? (
              gamification.badges.map((badge) => (
                <span key={badge} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400">
                  {badge}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No badges yet</p>
            )}
          </div>
        </div>
        <div className={`${card} transition hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Classrooms</p>
          <p className="mt-1 text-3xl font-bold text-white">
            {loading ? <span className="animate-pulse">...</span> : classrooms.length}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <h2 className="text-lg font-semibold text-white">My Classrooms</h2>
          <div className="mt-3 space-y-2 text-sm">
            {loading && <p className="animate-pulse text-slate-500">Loading classrooms...</p>}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && !error && classrooms.length === 0 && (
              <p className="text-slate-500">Not enrolled in any classrooms yet.</p>
            )}
            {!loading && !error && classrooms.length > 0 && (
              <ul className="space-y-2">
                {classrooms.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/student/classrooms/${c.id}`}
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
          <h2 className="text-lg font-semibold text-white">Join a Classroom</h2>
          <p className="mt-1 text-sm text-slate-400">Enter the classroom code from your teacher.</p>
          <form className="mt-3 space-y-3" onSubmit={handleJoin}>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 font-mono text-sm uppercase text-slate-200 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              placeholder="e.g. PHYS-ABC"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              required
            />
            {joinStatus.message && (
              <p className={`rounded-lg border px-3 py-2 text-sm ${
                joinStatus.kind === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}>
                {joinStatus.message}
              </p>
            )}
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 disabled:opacity-60 disabled:shadow-none"
              disabled={joining}
            >
              {joining ? "Joining..." : "Join"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
