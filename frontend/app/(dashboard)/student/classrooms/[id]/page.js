"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { apiGet } from "@/lib/api";

const card = "rounded-xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-md";

export default function StudentClassroomPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [classroom, setClassroom] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet(`/classrooms/${params.id}`),
      apiGet(`/classrooms/${params.id}/lessons`),
      apiGet(`/classrooms/${params.id}/quizzes`),
    ])
      .then(([classroomData, lessonsData, quizzesData]) => {
        if (!cancelled) { setClassroom(classroomData); setLessons(lessonsData); setQuizzes(quizzesData); }
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load classroom"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href="/student">&larr; Student dashboard</Link>
        <Link className="transition hover:text-cyan-400" href="/">Home</Link>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Classroom</p>
        <h1 className="text-3xl font-bold text-white">
          {loading ? <span className="animate-pulse">Loading...</span> : classroom?.name || `Classroom ${params.id}`}
        </h1>
        <p className="text-slate-400">
          {classroom?.description || "Lessons, quizzes, and progress for this classroom."}
        </p>
      </header>

      {loading && <p className="animate-pulse text-slate-500">Loading...</p>}
      {!loading && error && <p className="text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={card}>
            <h2 className="text-lg font-semibold text-white">Lessons</h2>
            <div className="mt-3 space-y-2 text-sm">
              {lessons.length === 0 ? (
                <p className="text-slate-500">No lessons yet.</p>
              ) : (
                <ul className="space-y-2">
                  {lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2.5 transition hover:bg-slate-800">
                      <span className="text-slate-200">{lesson.title}</span>
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">{lesson.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={card}>
            <h2 className="text-lg font-semibold text-white">Quizzes</h2>
            <div className="mt-3 space-y-2 text-sm">
              {quizzes.length === 0 ? (
                <p className="text-slate-500">No quizzes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {quizzes.map((quiz) => (
                    <li key={quiz.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2.5 transition hover:bg-slate-800">
                      <span className="text-slate-200">{quiz.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        quiz.is_published
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                      }`}>
                        {quiz.is_published ? "Published" : "Draft"}
                      </span>
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
