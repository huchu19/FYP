"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiGet, apiPost, getAccessToken } from "@/lib/api";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
import { speak, stopSpeaking, isTTSSupported } from "@/lib/tts";
import FlashcardViewer from "@/components/lesson/FlashcardViewer";
import LessonBodyRenderer from "@/components/lesson/LessonBodyRenderer";
import {
  breadcrumb, breadcrumbLink, pageSection, badgeCyan, emptyState, loadingText, cardElevated,
} from "@/lib/styles";

export default function StudentLessonPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [quizType, setQuizType] = useState("standard");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    apiGet(`/lessons/${params.lessonId}`)
      .then(setLesson)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    apiGet(`/lessons/${params.lessonId}/documents`)
      .then(setDocuments)
      .catch((err) => console.error("Failed to load documents:", err.message));
  }, [params.lessonId]);

  async function handleDownloadDocument(doc) {
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE}/lessons/${params.lessonId}/documents/${doc.id}/download`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGenerateSelfQuiz() {
    setGeneratingQuiz(true);
    setError("");
    try {
      const quiz = await apiPost(
        `/lessons/${params.lessonId}/self-quiz?difficulty=${difficulty}&quiz_type=${quizType}&num_questions=5`,
        {}
      );
      router.push(`/student/classrooms/${params.id}/quizzes/${quiz.id}`);
    } catch (err) {
      setError(err.message);
      setGeneratingQuiz(false);
    }
  }

  if (loading) return <p className={`py-10 ${loadingText}`}>Loading lesson...</p>;
  if (error) return <p className="py-10 text-[var(--color-danger)]">{error}</p>;

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/student/classrooms/${params.id}`}>&larr; Classroom</Link>
        <Link className={breadcrumbLink} href="/student">Dashboard</Link>
      </div>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-[var(--text-heading)]">{lesson.title}</h1>
          {lesson.generated_by_ai && <span className={badgeCyan}>AI</span>}
        </div>
        {isTTSSupported() && lesson.body && (
          <button
            onClick={() => {
              if (speaking) {
                stopSpeaking();
                setSpeaking(false);
              } else {
                const utterance = speak(lesson.body);
                if (utterance) {
                  setSpeaking(true);
                  utterance.onend = () => setSpeaking(false);
                }
              }
            }}
            className="mt-2 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-3 py-1.5 text-sm text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]"
            aria-label={speaking ? "Stop reading lesson aloud" : "Read lesson aloud"}
          >
            {speaking ? "Stop Reading" : "Read Aloud"}
          </button>
        )}
      </header>

      {lesson.body ? (
        <LessonBodyRenderer
          markdown={lesson.body}
          lessonTitle={lesson.title}
          contentFormat={lesson.content_format}
          lessonId={lesson.id}
        />
      ) : (
        <div className={emptyState}>This lesson has no content yet.</div>
      )}

      {lesson.flashcards?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Flashcards</h2>
          <FlashcardViewer flashcards={lesson.flashcards} />
        </div>
      )}

      {documents.length > 0 && (
        <div className={`${cardElevated} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Supporting Documents</h2>
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between text-sm">
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="text-[var(--color-primary)] underline decoration-[var(--color-primary)]/30 hover:decoration-[var(--color-primary)] transition text-left"
                >
                  {doc.filename}
                </button>
                <span className="text-xs text-[var(--text-muted)]">{new Date(doc.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Teach Back CTA */}
      <div className="rounded-[1.5rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent-soft)] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--color-accent)]">Teach Back</h3>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              Teach this lesson to Alex, a virtual student, to test your understanding.
            </p>
          </div>
          <Link
            href={`/student/classrooms/${params.id}/teach/${params.lessonId}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-[0.95rem] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--color-accent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-accent)]/18"
            aria-label="Start teaching this lesson"
          >
            Start Teaching
          </Link>
        </div>
      </div>

      {/* Test Yourself CTA */}
      <div className={`${cardElevated} p-5 space-y-4`}>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Test Yourself</h3>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            Generate a custom quiz to assess your understanding of this lesson.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-faint)] mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={generatingQuiz}
              className="rounded-lg border border-[var(--border-card)] px-3 py-2 text-sm text-[var(--text-heading)] bg-[var(--bg-input)]"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-faint)] mb-1">Type</label>
            <select
              value={quizType}
              onChange={(e) => setQuizType(e.target.value)}
              disabled={generatingQuiz}
              className="rounded-lg border border-[var(--border-card)] px-3 py-2 text-sm text-[var(--text-heading)] bg-[var(--bg-input)]"
            >
              <option value="standard">Standard (MCQ)</option>
              <option value="kahoot">Kahoot</option>
              <option value="metacognitive">Metacognitive</option>
            </select>
          </div>
          <button
            onClick={handleGenerateSelfQuiz}
            disabled={generatingQuiz}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-[var(--shadow-primary)] disabled:opacity-60"
          >
            {generatingQuiz ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>
    </section>
  );
}
