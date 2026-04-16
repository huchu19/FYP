"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiGet, apiPost } from "@/lib/api";
import QuestionEditor from "@/components/quiz/QuestionEditor";
import {
  card, btnPrimary, btnSecondary, breadcrumb, breadcrumbLink,
  pageSection, pageHeader, headerTag, pageTitle, pageSubtitle,
  inputClass,
} from "@/lib/styles";

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];
const QUIZ_TYPE_OPTIONS = ["standard", "kahoot", "metacognitive"];

export default function NewQuizPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const classroomId = params.id;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [quizType, setQuizType] = useState("standard");
  const [lessonId, setLessonId] = useState("");
  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: "",
      hints: ["", "", ""],
      concept_tags: [],
    },
  ]);
  const [lessons, setLessons] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet(`/classrooms/${classroomId}/lessons`).then(setLessons).catch(() => {});
  }, [classroomId]);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (questions.length === 0) {
      setError("Add at least one question");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const quiz = await apiPost("/quizzes?generate=false", {
        classroom_id: Number(classroomId),
        title: title.trim(),
        difficulty,
        quiz_type: quizType,
        lesson_id: lessonId ? Number(lessonId) : null,
        questions,
      });
      router.push(`/teacher/classrooms/${classroomId}/quizzes/${quiz.id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  }

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${classroomId}`}>
          &larr; Back to classroom
        </Link>
      </div>

      <header className={pageHeader}>
        <p className={headerTag}>New Quiz</p>
        <h1 className={pageTitle}>Create Quiz Manually</h1>
        <p className={pageSubtitle}>
          Build a quiz from scratch with full control over every question.
        </p>
      </header>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <div className={card}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Quiz Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kinematics Basics"
              className={inputClass}
              required
              aria-label="Quiz title"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Linked Lesson (optional)</label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className={inputClass}
              aria-label="Link to lesson"
            >
              <option value="">None</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    difficulty === d
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--color-primary)]/40"
                  }`}
                  aria-label={`Difficulty: ${d}`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Quiz Type</label>
            <div className="flex gap-2">
              {QUIZ_TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQuizType(t)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    quizType === t
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--color-primary)]/40"
                  }`}
                  aria-label={`Type: ${t}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <QuestionEditor
        questions={questions}
        setQuestions={setQuestions}
        quizType={quizType}
      />

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleCreate}
          disabled={creating || !title.trim() || questions.length === 0}
          className={btnPrimary}
          aria-label="Create quiz"
        >
          {creating ? "Creating..." : "Create Quiz"}
        </button>
        <Link href={`/teacher/classrooms/${classroomId}`} className={btnSecondary}>
          Cancel
        </Link>
      </div>
    </section>
  );
}
