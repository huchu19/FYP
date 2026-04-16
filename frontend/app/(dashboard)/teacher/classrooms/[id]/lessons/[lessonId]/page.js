"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";

import { apiGet, apiPost, apiPatch, apiDelete, getAccessToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
import FlashcardViewer from "@/components/lesson/FlashcardViewer";
import LessonBodyRenderer from "@/components/lesson/LessonBodyRenderer";
import GenerationDeck from "@/components/ui/GenerationDeck";
import {
  cardElevated, btnDanger, breadcrumb, breadcrumbLink,
  pageSection, badgeCyan, listItem, loadingText,
} from "@/lib/styles";

export default function LessonDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [reformatting, setReformatting] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [quizGenerationStartedAt, setQuizGenerationStartedAt] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [updating, setUpdating] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizType, setQuizType] = useState("standard");
  const router = useRouter();

  const FORMAT_OPTIONS = [
    { value: "slides", label: "Slides" },
    { value: "pdf_report", label: "PDF Report" },
    { value: "presentation", label: "Presentation" },
    { value: "flashcards", label: "Flashcards" },
  ];

  useEffect(() => {
    apiGet(`/lessons/${params.lessonId}`)
      .then((l) => {
        setLesson(l);
        setEditTitle(l.title);
        setEditBody(l.body || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    apiGet(`/classrooms/${params.id}/quizzes`)
      .then((all) => all.filter((q) => q.lesson_id === Number(params.lessonId)))
      .then(setQuizzes)
      .catch(() => {});

    apiGet(`/lessons/${params.lessonId}/documents`)
      .then(setDocuments)
      .catch((err) => console.error("Failed to load documents:", err.message));
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
    setQuizGenerationStartedAt(Date.now());
    setError("");
    try {
      const typeLabel = quizType.charAt(0).toUpperCase() + quizType.slice(1);
      const quiz = await apiPost("/quizzes?generate=true", {
        classroom_id: Number(params.id),
        lesson_id: Number(params.lessonId),
        title: `${typeLabel} Quiz: ${lesson.title}`,
        difficulty: quizDifficulty,
        quiz_type: quizType,
        questions: [],
      });
      setQuizzes((prev) => [...prev, quiz]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingQuiz(false);
      setQuizGenerationStartedAt(null);
    }
  }

  async function handleReformat(format) {
    if (format === lesson.content_format) return;
    setReformatting(true);
    setError("");
    try {
      const updated = await apiPost(`/lessons/${params.lessonId}/reformat`, {
        content_format: format,
      });
      setLesson(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setReformatting(false);
    }
  }

  async function handleSaveEdit() {
    setUpdating(true);
    setError("");
    try {
      const updated = await apiPatch(`/lessons/${params.lessonId}`, {
        title: editTitle,
        body: editBody,
      });
      setLesson(updated);
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleUploadDocument(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getAccessToken();
      const response = await fetch(`${API_BASE}/lessons/${params.lessonId}/documents`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        let detail = `Upload failed (${response.status})`;
        try {
          const body = await response.json();
          if (body?.detail) detail = body.detail;
        } catch (_) {}
        throw new Error(detail);
      }
      const doc = await response.json();
      setDocuments((prev) => [...prev, doc]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

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

  async function handleExport(format) {
    setError("");
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE}/lessons/${params.lessonId}/export?format=${format}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!response.ok) throw new Error(`Export failed (${response.status})`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      if (format === "html") {
        // Open in new tab for Print → Save as PDF
        window.open(url, "_blank");
        // Release URL after a delay so the new tab can load it
        setTimeout(() => window.URL.revokeObjectURL(url), 30000);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${lesson.title || "lesson"}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className={`py-10 ${loadingText}`}>Loading lesson...</p>;
  if (error) return <p className="py-10 text-[var(--color-danger)]">{error}</p>;

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${params.id}`}>&larr; Classroom</Link>
        <Link className={breadcrumbLink} href="/teacher">Dashboard</Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {editMode ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-3xl font-bold text-[var(--text-heading)] border border-[var(--border-card)] rounded px-2 py-1 bg-transparent"
              />
            ) : (
              <h1 className="text-3xl font-bold text-[var(--text-heading)]">{lesson.title}</h1>
            )}
            {lesson.generated_by_ai && (
              <span className={badgeCyan}>AI</span>
            )}
            <button
              onClick={() => {
                if (editMode) {
                  setEditTitle(lesson.title);
                  setEditBody(lesson.body || "");
                  setEditMode(false);
                } else {
                  setEditMode(true);
                }
              }}
              className="ml-2 text-[var(--text-muted)] hover:text-[var(--text-heading)] transition"
              title={editMode ? "Cancel edit" : "Edit lesson"}
            >
              {editMode ? "✕" : "✎"}
            </button>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Status: <span className={lesson.status === "published" ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}>{lesson.status}</span>
            {lesson.published_at && ` \u00b7 Published ${new Date(lesson.published_at).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editMode && (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={updating}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-[var(--shadow-primary)] disabled:opacity-60"
              >
                {updating ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditTitle(lesson.title);
                  setEditBody(lesson.body || "");
                  setEditMode(false);
                }}
                className="rounded-lg border border-[var(--border-card)] px-4 py-2 text-sm font-semibold text-[var(--text-heading)] hover:bg-[var(--bg-soft)]"
              >
                Cancel
              </button>
            </>
          )}
          {!editMode && (
            <>
              <div className="relative group">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-success)]/30 px-4 py-2.5 text-sm font-semibold text-[var(--color-success)] transition hover:bg-[var(--color-success)]/5"
                  title="Export lesson"
                >
                  Export ▼
                </button>
                <div className="absolute right-0 top-full hidden group-hover:block pt-1 z-10">
                 <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg shadow-lg py-1 min-w-[180px]">
                  <button
                    onClick={() => handleExport("markdown")}
                    className="block w-full text-left px-4 py-2 text-sm text-[var(--text-heading)] hover:bg-[var(--bg-soft)]"
                  >
                    Download Markdown
                  </button>
                  <button
                    onClick={() => handleExport("html")}
                    className="block w-full text-left px-4 py-2 text-sm text-[var(--text-heading)] hover:bg-[var(--bg-soft)]"
                  >
                    Print as PDF
                  </button>
                 </div>
                </div>
              </div>
              <button
                onClick={handleTogglePublish}
                disabled={publishing}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                  lesson.status === "published"
                    ? "border border-[var(--color-warning)]/30 text-[var(--color-warning)] hover:bg-amber-500/10"
                    : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)]"
                }`}
              >
                {publishing ? "..." : lesson.status === "published" ? "Unpublish" : "Publish"}
              </button>
            </>
          )}
        </div>
      </header>

      {editMode && (
        <div className={`${cardElevated} p-5 space-y-4`}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-2">
              Body (Markdown)
            </label>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full h-64 p-3 border border-[var(--border-card)] rounded-lg bg-[var(--bg-input)] text-[var(--text-heading)] font-mono text-sm resize-none"
              placeholder="## Section&#10;Content here..."
            />
          </div>
        </div>
      )}

      {!editMode && (
        <>
          {/* Document Upload Section */}
          <div className={`${cardElevated} p-5 space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Supporting Documents</h2>
            </div>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center px-4 py-2.5 rounded-lg border border-[var(--color-primary)]/30 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition">
                <input
                  type="file"
                  onChange={handleUploadDocument}
                  disabled={uploading}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                />
                {uploading ? "Uploading..." : "+ Upload"}
              </label>
              <span className="text-xs text-[var(--text-muted)]">PDF, DOCX, or TXT</span>
            </div>
            {documents.length > 0 && (
              <ul className="space-y-2 border-t border-[var(--border-card)] pt-3">
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
            )}
          </div>
        </>
      )}

      {generatingQuiz && quizGenerationStartedAt && (
        <GenerationDeck
          eyebrow="Quiz Pipeline"
          title="Building a question set from this lesson"
          description="The quiz engine is mapping lesson content into a balanced assessment, attaching concept coverage, and drafting progressive hints so the result feels authored rather than generic."
          launchedAt={quizGenerationStartedAt}
          accent="accent"
          context={[
            { label: "Lesson", value: lesson.title },
            { label: "Format", value: lesson.content_format || "Lesson" },
            { label: "Difficulty", value: "Medium" },
          ]}
          stages={[
            {
              label: "Concept Scan",
              detail: "Reading the lesson body and locking the ideas that deserve assessment coverage.",
            },
            {
              label: "Question Mix",
              detail: "Balancing difficulty, phrasing, and answer-option separation.",
            },
            {
              label: "Hint Scaffold",
              detail: "Drafting progressive hint levels so support can be revealed without spoiling the answer.",
            },
            {
              label: "Draft Delivery",
              detail: "Packaging the quiz payload and attaching it back to this lesson.",
            },
          ]}
          footer="The quiz list below will update as soon as the new draft lands."
        />
      )}

      {!editMode && (
        <>
      {/* Format switcher */}
      <div className={`${cardElevated} p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">Format</span>
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt.value}
              onClick={() => handleReformat(fmt.value)}
              disabled={reformatting}
              className={`rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
                lesson.content_format === fmt.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]"
                  : "border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--text-heading)]"
              }`}
            >
              {fmt.label}
            </button>
          ))}
          {reformatting && (
            <span className="animate-pulse text-xs text-[var(--color-primary)]">Regenerating content...</span>
          )}
        </div>
      </div>

      {lesson.body ? (
        <LessonBodyRenderer
          markdown={lesson.body}
          lessonTitle={lesson.title}
          contentFormat={lesson.content_format}
        />
      ) : lesson.outline?.length > 0 ? (
        <div className={`${cardElevated} p-5`}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Outline</h2>
          <ol className="list-decimal space-y-1 pl-5 text-[var(--text-secondary)]">
            {lesson.outline.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {lesson.flashcards?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Flashcards</h2>
          <FlashcardViewer flashcards={lesson.flashcards} />
        </div>
      )}

      {/* Quiz Builder */}
      <div className={`${cardElevated} p-5 space-y-4`}>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Generate a Quiz</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Pick a difficulty and format, then generate an AI-authored quiz from this lesson.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-faint)]">Difficulty</label>
            <select
              value={quizDifficulty}
              onChange={(e) => setQuizDifficulty(e.target.value)}
              disabled={generatingQuiz}
              className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-heading)]"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="adaptive">Adaptive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-faint)]">Format</label>
            <select
              value={quizType}
              onChange={(e) => setQuizType(e.target.value)}
              disabled={generatingQuiz}
              className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-heading)]"
            >
              <option value="standard">Standard (MCQ)</option>
              <option value="kahoot">Kahoot (game-show)</option>
              <option value="metacognitive">Metacognitive (reasoning)</option>
            </select>
          </div>
          <button
            onClick={handleGenerateQuiz}
            disabled={generatingQuiz}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] disabled:opacity-60"
          >
            {generatingQuiz ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>

      {quizzes.length > 0 && (
        <div className={`${cardElevated} p-5`}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Quizzes</h2>
          <ul className="space-y-2">
            {generatingQuiz && (
              <li className="rounded-[1.1rem] border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-accent)]">
                New quiz draft incoming. The assessment pipeline is still running.
              </li>
            )}
            {quizzes.map((q) => (
              <li key={q.id}>
                <Link href={`/teacher/classrooms/${params.id}/quizzes/${q.id}`} className={listItem}>
                  <span className="text-sm text-[var(--text-primary)]">{q.title}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--text-faint)]">{q.questions?.length || 0} questions</span>
                    <span className={q.is_published ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}>
                      {q.is_published ? "Published" : "Draft"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {quizzes.length === 0 && generatingQuiz && (
        <div className={`${cardElevated} p-5`}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Quizzes</h2>
          <div className="rounded-[1.25rem] border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] px-4 py-4 text-sm text-[var(--color-accent)]">
            The first quiz draft for this lesson is currently being assembled.
          </div>
        </div>
      )}

      {lesson.prompt && (
        <div className={`${cardElevated} p-5`}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Original Prompt</h2>
          <p className="text-sm text-[var(--text-muted)]">{lesson.prompt}</p>
        </div>
      )}
        </>
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
          className={btnDanger}
        >
          Delete lesson
        </button>
      </div>
    </section>
  );
}
