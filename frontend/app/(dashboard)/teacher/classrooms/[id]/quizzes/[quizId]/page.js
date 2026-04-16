"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import QuestionEditor from "@/components/quiz/QuestionEditor";
import {
  cardElevated, btnPrimary, btnSecondary, btnDanger, btnGhost,
  breadcrumb, breadcrumbLink, pageSection, loadingText, emptyState,
} from "@/lib/styles";

export default function QuizDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editQuestions, setEditQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

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

  function startEditing() {
    setEditQuestions(JSON.parse(JSON.stringify(quiz.questions || [])));
    setEditing(true);
  }

  function cancelEditing() {
    setEditQuestions([]);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiPatch(`/quizzes/${params.quizId}`, {
        questions: editQuestions,
      });
      setQuiz(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={`py-10 ${loadingText}`}>Loading quiz...</p>;
  if (error) return <p className="py-10 text-[var(--color-danger)]">{error}</p>;

  const questions = quiz.questions || [];

  function getDifficultyBadgeColor(difficulty) {
    const colors = {
      easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      medium: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      hard: "bg-red-500/10 text-red-600 border-red-500/30",
      adaptive: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    };
    return colors[difficulty] || colors.medium;
  }

  function renderQuestion(q, idx) {
    if (quiz.quiz_type === "kahoot") {
      return (
        <div key={idx} className={`${cardElevated} p-5`}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="font-medium text-[var(--text-heading)]">
              <span className="mr-2 text-[var(--color-primary)]">{idx + 1}.</span>
              {q.question}
            </p>
            <div className="flex gap-2 text-xs">
              {q.time_limit_seconds && (
                <span className="px-2 py-1 rounded bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                  ⏱ {q.time_limit_seconds}s
                </span>
              )}
              {q.points && (
                <span className="px-2 py-1 rounded bg-[var(--color-success-soft)] text-[var(--color-success)]">
                  ★ {q.points} pts
                </span>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(q.options || []).map((opt, oi) => (
              <div
                key={oi}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  opt === q.correct_answer
                    ? "border-emerald-500/40 bg-[var(--color-success-soft)] text-[var(--color-success)]"
                    : "border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-heading)]"
                }`}
              >
                {opt}
              </div>
            ))}
          </div>
          {q.explanation && (
            <p className="mt-3 text-xs text-[var(--text-faint)]">
              <span className="font-semibold text-[var(--text-muted)]">Explanation:</span> {q.explanation}
            </p>
          )}
        </div>
      );
    }

    if (quiz.quiz_type === "metacognitive") {
      return (
        <div key={idx} className={`${cardElevated} p-5`}>
          <p className="mb-4 font-medium text-[var(--text-heading)]">
            <span className="mr-2 text-[var(--color-primary)]">{idx + 1}.</span>
            {q.question}
          </p>
          {q.reasoning_prompt && (
            <div className="mb-4 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--color-accent)] mb-1">Reasoning Prompt</p>
              <p className="text-sm text-[var(--text-secondary)]">{q.reasoning_prompt}</p>
            </div>
          )}
          {q.steps && Array.isArray(q.steps) && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Solution Steps</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--text-secondary)]">
                {q.steps.map((step, si) => (
                  <li key={si}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          <div className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-sunken)] p-3">
            <p className="text-xs font-semibold text-[var(--text-faint)] mb-2">Student Reasoning (they will write here)</p>
            <div className="min-h-12 text-xs text-[var(--text-faint)] italic">Student&apos;s response will appear here...</div>
          </div>
        </div>
      );
    }

    // standard (default)
    return (
      <div key={idx} className={`${cardElevated} p-5`}>
        <p className="mb-3 font-medium text-[var(--text-heading)]">
          <span className="mr-2 text-[var(--color-primary)]">{idx + 1}.</span>
          {q.question}
        </p>
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {(q.options || []).map((opt, oi) => (
            <div
              key={oi}
              className={`rounded-lg border px-3 py-2 text-sm ${
                opt === q.correct_answer
                  ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--color-success)]"
                  : "border-[var(--border-card)] bg-[var(--bg-sunken)] text-[var(--text-secondary)]"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
        {q.explanation && (
          <p className="text-xs text-[var(--text-faint)]">
            <span className="font-semibold text-[var(--text-muted)]">Explanation:</span> {q.explanation}
          </p>
        )}
      </div>
    );
  }

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${params.id}`}>&larr; Classroom</Link>
        {quiz.lesson_id && (
          <Link className={breadcrumbLink} href={`/teacher/classrooms/${params.id}/lessons/${quiz.lesson_id}`}>&larr; Lesson</Link>
        )}
        <Link className={breadcrumbLink} href="/teacher">Dashboard</Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--text-heading)]">{quiz.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getDifficultyBadgeColor(quiz.difficulty)}`}>
              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              {questions.length} questions · Type: {quiz.quiz_type || "standard"} ·{" "}
              <span className={quiz.is_published ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}>
                {quiz.is_published ? "Published" : "Draft"}
              </span>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={startEditing}
              className={btnSecondary}
              aria-label="Edit quiz questions"
            >
              Edit Quiz
            </button>
          )}
          <button
            onClick={handleTogglePublish}
            disabled={publishing || editing}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
              quiz.is_published
                ? "border border-[var(--color-warning)]/30 text-[var(--color-warning)] hover:bg-amber-500/10"
                : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)]"
            }`}
          >
            {publishing ? "..." : quiz.is_published ? "Unpublish" : "Publish"}
          </button>
        </div>
      </header>

      {editing ? (
        <>
          <QuestionEditor
            questions={editQuestions}
            setQuestions={setEditQuestions}
            quizType={quiz.quiz_type || "standard"}
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className={btnPrimary}
              aria-label="Save quiz changes"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={cancelEditing}
              disabled={saving}
              className={btnSecondary}
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((q, idx) => renderQuestion(q, idx))}
          </div>

          {questions.length === 0 && (
            <div className={emptyState}>
              No questions in this quiz yet. Click &quot;Edit Quiz&quot; to add questions.
            </div>
          )}
        </>
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
          className={btnDanger}
        >
          Delete quiz
        </button>
      </div>
    </section>
  );
}
