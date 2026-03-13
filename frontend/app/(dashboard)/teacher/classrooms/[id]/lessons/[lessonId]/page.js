"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";

import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

export default function LessonDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    apiGet(`/lessons/${params.lessonId}`)
      .then(setLesson)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    apiGet(`/classrooms/${params.id}/quizzes`)
      .then((all) => all.filter((q) => q.lesson_id === Number(params.lessonId)))
      .then(setQuizzes)
      .catch(() => {});
  }, [params.lessonId, params.id]);

  async function handleTogglePublish() {
    setPublishing(true);
    try {
      const action = lesson.status === "published" ? "unpublish" : "publish";
      const updated = await apiPatch(`/lessons/${params.lessonId}/${action}`);
      setLesson(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleGenerateQuiz() {
    setGeneratingQuiz(true);
    setError("");
    try {
      const quiz = await apiPost("/quizzes?generate=true", {
        classroom_id: Number(params.id),
        lesson_id: Number(params.lessonId),
        title: `Quiz: ${lesson.title}`,
        difficulty: "medium",
        questions: [],
      });
      setQuizzes((prev) => [...prev, quiz]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingQuiz(false);
    }
  }

  if (loading) return <p className="py-10 text-slate-400">Loading lesson...</p>;
  if (error) return <p className="py-10 text-red-400">{error}</p>;

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href={`/teacher/classrooms/${params.id}`}>&larr; Classroom</Link>
        <Link className="transition hover:text-cyan-400" href="/teacher">Dashboard</Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white">{lesson.title}</h1>
            {lesson.generated_by_ai && (
              <span className="rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">AI</span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Status: <span className={lesson.status === "published" ? "text-emerald-400" : "text-amber-400"}>{lesson.status}</span>
            {lesson.published_at && ` \u00b7 Published ${new Date(lesson.published_at).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateQuiz}
            disabled={generatingQuiz}
            className="rounded-lg border border-violet-500/30 px-5 py-2.5 text-sm font-semibold text-violet-400 transition hover:bg-violet-500/10 disabled:opacity-60"
          >
            {generatingQuiz ? "Generating quiz..." : "Generate Quiz"}
          </button>
          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
              lesson.status === "published"
                ? "border border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
            }`}
          >
            {publishing ? "..." : lesson.status === "published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </header>

      {lesson.outline?.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Outline</h2>
          <ol className="list-decimal space-y-1 pl-5 text-slate-300">
            {lesson.outline.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        </div>
      )}

      {lesson.body && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Content</h2>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-slate-300">
            {lesson.body}
          </div>
        </div>
      )}

      {quizzes.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Quizzes</h2>
          <ul className="space-y-2">
            {quizzes.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/teacher/classrooms/${params.id}/quizzes/${q.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-3 transition hover:border-cyan-500/30"
                >
                  <span className="text-sm text-slate-200">{q.title}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">{q.questions?.length || 0} questions</span>
                    <span className={q.is_published ? "text-emerald-400" : "text-amber-400"}>
                      {q.is_published ? "Published" : "Draft"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.prompt && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Original Prompt</h2>
          <p className="text-sm text-slate-400">{lesson.prompt}</p>
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={async () => {
            if (!confirm("Delete this lesson? This cannot be undone.")) return;
            try {
              await apiDelete(`/lessons/${params.lessonId}`);
              router.push(`/teacher/classrooms/${params.id}`);
            } catch (err) {
              setError(err.message);
            }
          }}
          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
        >
          Delete lesson
        </button>
      </div>
    </section>
  );
}
