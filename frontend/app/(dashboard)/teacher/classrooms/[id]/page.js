"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { apiGet } from "@/lib/api";

const card = "rounded-xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-md";

export default function ClassroomPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [classroom, setClassroom] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet(`/classrooms/${params.id}`),
      apiGet(`/classrooms/${params.id}/lessons`),
    ])
      .then(([classroomData, lessonsData]) => {
        if (!cancelled) { setClassroom(classroomData); setLessons(lessonsData); }
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load classroom"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href="/teacher">&larr; Teacher dashboard</Link>
        <Link className="transition hover:text-cyan-400" href={`/teacher/classrooms/${params.id}/lessons/new`}>New lesson</Link>
        <Link className="transition hover:text-cyan-400" href="/">Home</Link>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Classroom</p>
        <h1 className="text-3xl font-bold text-white">
          {loading ? <span className="animate-pulse">Loading classroom...</span> : classroom?.name || `Classroom ${params.id}`}
        </h1>
        <p className="text-slate-400">Roster, lessons, and classroom metadata.</p>
      </header>

      {loading && <p className="animate-pulse text-slate-500">Loading...</p>}
      {!loading && error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={card}>
            <h2 className="text-lg font-semibold text-white">Details</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Code</p>
                <p className="mt-1 font-mono text-lg font-bold text-cyan-400">{classroom?.code}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</p>
                <p className="mt-1 text-slate-300">{classroom?.description || "No description yet."}</p>
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Lessons</h2>
              <Link href={`/teacher/classrooms/${params.id}/lessons/new`} className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300">+ New</Link>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {lessons.length === 0 ? (
                <p className="text-slate-500">No lessons yet. Create one to get started.</p>
              ) : (
                <ul className="space-y-2">
                  {lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/teacher/classrooms/${params.id}/lessons/${lesson.id}`}
                        className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2.5 transition hover:bg-slate-800"
                      >
                        <span className="text-slate-200">{lesson.title}</span>
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">{lesson.status}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
