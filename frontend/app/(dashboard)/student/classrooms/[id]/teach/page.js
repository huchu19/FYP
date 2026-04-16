"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { apiGet } from "@/lib/api";
import {
  breadcrumb, breadcrumbLink, pageSection, pageHeader, headerTag, pageTitle,
  pageSubtitle, card, badgeSuccess, badgeViolet, loadingText, emptyState,
} from "@/lib/styles";

export default function TeachingHistoryPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id: classroomId } = params;

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet(`/teaching-sessions/?classroom_id=${classroomId}`)
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [classroomId]);

  if (loading) return <p className={`py-10 ${loadingText}`}>Loading sessions...</p>;

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/student/classrooms/${classroomId}`}>&larr; Classroom</Link>
        <Link className={breadcrumbLink} href="/student">Dashboard</Link>
      </div>

      <div className={pageHeader}>
        <span className={headerTag}>Peer Teaching</span>
        <h1 className={`mt-3 ${pageTitle}`}>Teaching Sessions</h1>
        <p className={`mt-2 ${pageSubtitle}`}>
          Review your past teaching sessions and track your improvement.
        </p>
      </div>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      {sessions.length === 0 ? (
        <div className={emptyState}>
          No teaching sessions yet. Open a lesson and click &ldquo;Start Teaching&rdquo; to begin.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} classroomId={classroomId} />
          ))}
        </div>
      )}
    </section>
  );
}

function SessionCard({ session, classroomId }) {
  const score = session.overall_score;
  const scoreColor =
    score == null ? "var(--text-faint)" :
    score >= 0.8 ? "var(--color-success)" :
    score >= 0.6 ? "var(--color-accent)" :
    "var(--color-danger)";

  const statusBadge =
    session.status === "completed" ? badgeSuccess :
    session.status === "active" ? badgeViolet :
    "rounded-[0.75rem] border border-[var(--border-card)] bg-[var(--bg-sunken)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]";

  const date = session.created_at
    ? new Date(session.created_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "";

  return (
    <Link
      href={`/student/classrooms/${classroomId}/teach/${session.id}`}
      className={`${card} flex items-center justify-between gap-4 p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold text-[var(--text-heading)]">{session.topic}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-faint)]">
          <span>{date}</span>
          <span>{session.turn_count} turn{session.turn_count !== 1 ? "s" : ""}</span>
          <span className={statusBadge}>{session.status}</span>
        </div>
      </div>
      {score != null && (
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: scoreColor }}>
            {Math.round(score * 100)}%
          </p>
          <p className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--text-faint)]">Score</p>
        </div>
      )}
    </Link>
  );
}
