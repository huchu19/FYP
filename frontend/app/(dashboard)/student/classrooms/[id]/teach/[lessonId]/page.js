"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { apiGet, apiPost } from "@/lib/api";
import AssessmentResults from "@/components/teaching/AssessmentResults";
import {
  breadcrumb, breadcrumbLink, pageSection, btnPrimary, btnSecondary,
  inputClass, card, loadingText, emptyState,
} from "@/lib/styles";

/* ------------------------------------------------------------------ */
/*  Teach-back chat page                                               */
/* ------------------------------------------------------------------ */

export default function TeachBackPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id: classroomId, lessonId } = params;

  const [lesson, setLesson] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);

  const [session, setSession] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [loadingLesson, setLoadingLesson] = useState(true);

  const chatEndRef = useRef(null);

  /* ---------- load lesson + concepts ---------- */
  useEffect(() => {
    Promise.all([
      apiGet(`/lessons/${lessonId}`),
      apiGet(`/knowledge-graph/concepts?classroom_id=${classroomId}`).catch(() => []),
    ])
      .then(([l, c]) => {
        setLesson(l);
        const lessonConcepts = (c || []).filter(
          (concept) => concept.lesson_id === Number(lessonId)
        );
        setConcepts(lessonConcepts);
        if (lessonConcepts.length > 0) setSelectedConcept(lessonConcepts[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingLesson(false));
  }, [lessonId, classroomId]);

  /* ---------- auto-scroll chat ---------- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.conversation]);

  /* ---------- handlers ---------- */
  async function startSession() {
    setSending(true);
    setError("");
    try {
      const res = await apiPost("/teaching-sessions/start", {
        lesson_id: Number(lessonId),
        concept_id: selectedConcept,
      });
      setSession(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await apiPost("/teaching-sessions/message", {
        session_id: session.id,
        message: input.trim(),
      });
      setSession(res);
      setInput("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function completeSession() {
    setCompleting(true);
    setError("");
    try {
      const res = await apiPost("/teaching-sessions/complete", {
        session_id: session.id,
      });
      setSession(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  }

  /* ---------- loading / error states ---------- */
  if (loadingLesson) return <p className={`py-10 ${loadingText}`}>Loading lesson...</p>;
  if (!lesson) return <p className="py-10 text-[var(--color-danger)]">{error || "Lesson not found"}</p>;

  /* ---------- completed — show assessment ---------- */
  if (session?.status === "completed") {
    return (
      <section className={pageSection}>
        <div className={breadcrumb}>
          <Link className={breadcrumbLink} href={`/student/classrooms/${classroomId}`}>&larr; Classroom</Link>
          <Link className={breadcrumbLink} href={`/student/classrooms/${classroomId}/lessons/${lessonId}`}>Lesson</Link>
        </div>
        <AssessmentResults
          session={session}
          classroomId={classroomId}
          lessonId={lessonId}
          onRetry={() => { setSession(null); setInput(""); }}
        />
      </section>
    );
  }

  /* ---------- pre-session — concept selection ---------- */
  if (!session) {
    return (
      <section className={pageSection}>
        <div className={breadcrumb}>
          <Link className={breadcrumbLink} href={`/student/classrooms/${classroomId}`}>&larr; Classroom</Link>
          <Link className={breadcrumbLink} href={`/student/classrooms/${classroomId}/lessons/${lessonId}`}>Lesson</Link>
        </div>

        <div className={`${card} max-w-xl space-y-6 p-8`}>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[var(--text-heading)]">Teach Back</h1>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Teach a concept from <strong className="text-[var(--text-primary)]">{lesson.title}</strong> to
              Alex, a virtual student who&apos;s struggling to understand. Teaching is one of the best
              ways to solidify your own understanding.
            </p>
          </div>

          {concepts.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)]">
                Choose a concept to teach
              </label>
              <select
                className={inputClass}
                value={selectedConcept || ""}
                onChange={(e) => setSelectedConcept(Number(e.target.value))}
                aria-label="Select concept to teach"
              >
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <button
            className={btnPrimary}
            onClick={startSession}
            disabled={sending}
            aria-label="Start teaching session"
          >
            {sending ? "Starting..." : "Start Teaching"}
          </button>
        </div>
      </section>
    );
  }

  /* ---------- active chat ---------- */
  const conversation = session.conversation || [];
  const studentTurns = conversation.filter((m) => m.role === "student").length;

  return (
    <section className={`${pageSection} flex flex-col`} style={{ minHeight: "calc(100vh - 8rem)" }}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/student/classrooms/${classroomId}`}>&larr; Classroom</Link>
        <Link className={breadcrumbLink} href={`/student/classrooms/${classroomId}/lessons/${lessonId}`}>Lesson</Link>
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-bold text-[var(--color-accent)]">
            A
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-heading)]">Teaching: {session.topic}</h2>
            <p className="text-xs text-[var(--text-faint)]">
              Turn {studentTurns}/{MAX_TURNS} &middot; Alex is listening
            </p>
          </div>
        </div>
        <button
          className={btnSecondary}
          onClick={completeSession}
          disabled={completing || studentTurns < 2}
          aria-label="Finish teaching session"
        >
          {completing ? "Assessing..." : "Finish Teaching"}
        </button>
      </div>

      {/* Chat messages */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-[1.5rem] border border-[var(--border-card)] bg-[var(--bg-sunken)] p-4">
        {conversation.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {sending && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-faint)]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
            Alex is thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}
      <form onSubmit={sendMessage} className="mt-3 flex gap-3">
        <input
          className={`${inputClass} flex-1`}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Explain the concept to Alex..."
          disabled={sending}
          aria-label="Type your teaching message"
        />
        <button
          type="submit"
          className={btnPrimary}
          disabled={sending || !input.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </section>
  );
}

const MAX_TURNS = 20;

/* ------------------------------------------------------------------ */
/*  Chat bubble component                                              */
/* ------------------------------------------------------------------ */

function ChatBubble({ message }) {
  const isStudent = message.role === "student";

  return (
    <div className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[80%] items-start gap-2.5">
        {!isStudent && (
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-bold text-[var(--color-accent)]">
            A
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isStudent
              ? "bg-[var(--color-primary)]/12 text-[var(--text-primary)] border border-[var(--color-primary)]/20"
              : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-card)]"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
