"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiGet, apiPatch, apiDelete } from "@/lib/api";

export default function QuizDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiGet(`/quizzes/${params.quizId}`)
      .then(setQuiz)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.quizId]);

  async function handleTogglePublish() {
    setPublishing(true);
    try {
      const action = quiz.is_published ? "unpublish" : "publish";
      const updated = await apiPatch(`/quizzes/${params.quizId}/${action}`);
      setQuiz(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <p className="py-10 text-slate-400">Loading quiz...</p>;
  if (error) return <p className="py-10 text-red-400">{error}</p>;

  const questions = quiz.questions || [];

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href={`/teacher/classrooms/${params.id}`}>&larr; Classroom</Link>
        {quiz.lesson_id && (
          <Link className="transition hover:text-cyan-400" href={`/teacher/classrooms/${params.id}/lessons/${quiz.lesson_id}`}>&larr; Lesson</Link>
        )}
        <Link className="transition hover:text-cyan-400" href="/teacher">Dashboard</Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
          <p className="text-sm text-slate-400">
            {questions.length} questions · Difficulty: {quiz.difficulty} ·{" "}
            <span className={quiz.is_published ? "text-emerald-400" : "text-amber-400"}>
              {quiz.is_published ? "Published" : "Draft"}
            </span>
          </p>
        </div>
        <button
          onClick={handleTogglePublish}
          disabled={publishing}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
            quiz.is_published
              ? "border border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
          }`}
        >
          {publishing ? "..." : quiz.is_published ? "Unpublish" : "Publish"}
        </button>
      </header>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5">
            <p className="mb-3 font-medium text-white">
              <span className="mr-2 text-cyan-400">{idx + 1}.</span>
              {q.question}
            </p>
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              {(q.options || []).map((opt, oi) => (
                <div
                  key={oi}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    opt === q.correct_answer
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-700/50 bg-slate-800/40 text-slate-300"
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
            {q.explanation && (
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Explanation:</span> {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700/50 bg-slate-800/30 p-8 text-center text-slate-500">
          No questions in this quiz yet.
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={async () => {
            if (!confirm("Delete this quiz? This cannot be undone.")) return;
            try {
              await apiDelete(`/quizzes/${params.quizId}`);
              router.push(`/teacher/classrooms/${params.id}`);
            } catch (err) {
              setError(err.message);
            }
          }}
          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
        >
          Delete quiz
        </button>
      </div>
    </section>
  );
}
