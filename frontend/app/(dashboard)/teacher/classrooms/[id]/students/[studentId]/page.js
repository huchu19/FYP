"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { apiGet } from "@/lib/api";
import ConceptGraph from "@/components/knowledge-graph/ConceptGraph";
import {
  card, breadcrumb, breadcrumbLink, pageSection, pageHeader,
  headerTag, pageTitle, pageSubtitle, statLabel, loadingText,
  progressTrack, tableHead, tableRow,
} from "@/lib/styles";

export default function StudentAnalyticsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const classroomId = params.id;
  const studentId = params.studentId;

  const [data, setData] = useState(null);
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet(`/analytics/teacher/student-detail?student_id=${studentId}&classroom_id=${classroomId}`),
      apiGet(`/knowledge-graph/graph?classroom_id=${classroomId}&student_id=${studentId}`).catch(() => null),
    ])
      .then(([res, graphData]) => {
        if (!cancelled) {
          setData(res);
          setGraph(graphData);
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load student data"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [classroomId, studentId]);

  const history = data?.quiz_history || [];
  const calibration = data?.calibration || {};
  const mastery = data?.topic_mastery || [];
  const graphNodes = graph?.nodes || [];

  // Flag overconfident concepts: low metacognitive score with enough attempts
  const overconfidentConcepts = graphNodes.filter(
    (n) => n.metacognitive_score != null && n.metacognitive_score < 0.4 && n.attempts >= 2
  );
  // Flag underconfident concepts: high mastery but low metacognitive score (they know it but don't believe it)
  const underconfidentConcepts = graphNodes.filter(
    (n) => n.mastery >= 0.7 && n.metacognitive_score != null && n.metacognitive_score < 0.5 && n.attempts >= 2
  );
  // ZPD concepts
  const zpdConcepts = graphNodes
    .filter((n) => n.zpd_delta != null && n.zpd_delta > 0.05)
    .sort((a, b) => b.zpd_delta - a.zpd_delta);

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${classroomId}`}>
          &larr; Back to classroom
        </Link>
      </div>

      <header className={pageHeader}>
        <p className={headerTag}>Student Analytics</p>
        <h1 className={pageTitle}>Student #{studentId}</h1>
        <p className={pageSubtitle}>
          Detailed performance, calibration, and topic mastery data.
        </p>
      </header>

      {loading && <p className={loadingText}>Loading...</p>}
      {!loading && error && <p className="text-[var(--color-danger)]">{error}</p>}

      {!loading && !error && (
        <>
          {/* Summary stat cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className={card}>
              <p className={statLabel}>Quizzes Taken</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-heading)]">{history.length}</p>
            </div>
            <div className={card}>
              <p className={statLabel}>Avg Score</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-heading)]">
                {history.length
                  ? (history.reduce((s, h) => s + (h.percentage || 0), 0) / history.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className={card}>
              <p className={statLabel}>Calibration</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-heading)]">
                {calibration.calibration_score != null
                  ? `${(calibration.calibration_score * 100).toFixed(0)}%`
                  : "N/A"}
              </p>
            </div>
            <div className={card}>
              <p className={statLabel}>Topics Covered</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-heading)]">{mastery.length}</p>
            </div>
          </div>

          {/* Score trend */}
          <div className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Score Trend</h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--text-faint)]">No quiz attempts yet.</p>
            ) : (
              <div className="mt-4 flex items-end gap-1.5" style={{ height: 160 }}>
                {history.map((h, i) => {
                  const pct = h.percentage || 0;
                  const color =
                    pct >= 80 ? "bg-emerald-500"
                      : pct >= 50 ? "bg-amber-500"
                      : "bg-red-500";
                  return (
                    <div key={i} className="group relative flex-1" style={{ height: "100%" }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t ${color} transition-all`}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-heading)] opacity-0 shadow transition group-hover:opacity-100">
                        {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topic mastery */}
          <div className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Topic Mastery</h2>
            {mastery.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--text-faint)]">No topic data available.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {mastery.map((t) => {
                  const color =
                    t.accuracy >= 80 ? "bg-emerald-500"
                      : t.accuracy >= 50 ? "bg-amber-500"
                      : "bg-red-500";
                  return (
                    <div key={t.topic}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-primary)]">{t.topic}</span>
                        <span className="text-[var(--text-muted)]">
                          {t.correct}/{t.total_questions} ({t.accuracy}%)
                        </span>
                      </div>
                      <div className={progressTrack}>
                        <div
                          className={`h-2.5 rounded-full ${color} transition-all`}
                          style={{ width: `${t.accuracy}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quiz history table */}
          <div className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Quiz History</h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--text-faint)]">No attempts recorded.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={tableHead}>
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Score</th>
                      <th className="pb-2 pr-4">Time</th>
                      <th className="pb-2 pr-4">Self-Rating</th>
                      <th className="pb-2">Reflection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i} className={tableRow}>
                        <td className="py-2 pr-4 text-[var(--text-secondary)]">
                          {h.started_at ? new Date(h.started_at).toLocaleDateString() : "\u2014"}
                        </td>
                        <td className="py-2 pr-4">
                          <span className={
                            h.percentage >= 80 ? "text-[var(--color-success)]"
                              : h.percentage >= 50 ? "text-[var(--color-warning)]"
                              : "text-[var(--color-danger)]"
                          }>
                            {h.score}/{h.max_score} ({h.percentage}%)
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-[var(--text-secondary)]">
                          {h.time_taken_seconds
                            ? `${Math.floor(h.time_taken_seconds / 60)}m ${h.time_taken_seconds % 60}s`
                            : "\u2014"}
                        </td>
                        <td className="py-2 pr-4 text-[var(--text-secondary)]">
                          {h.self_rated_understanding ? `${h.self_rated_understanding}/5` : "\u2014"}
                        </td>
                        <td className="max-w-xs truncate py-2 text-[var(--text-muted)]">
                          {h.reflection || "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Calibration insight */}
          {calibration.calibration_score != null && (
            <div className={card}>
              <h2 className="text-lg font-semibold text-[var(--text-heading)]">Metacognitive Insight</h2>
              <div className="mt-3 text-sm">
                <p className="text-[var(--text-secondary)]">
                  Self-assessment calibration:{" "}
                  <span className="font-bold text-[var(--text-heading)]">
                    {(calibration.calibration_score * 100).toFixed(0)}%
                  </span>{" "}
                  across {calibration.total_rated} rated questions.
                </p>
                <p className="mt-2 text-[var(--text-muted)]">
                  {calibration.calibration_score >= 0.75
                    ? "This student has strong self-awareness — their confidence ratings closely match actual performance."
                    : calibration.calibration_score >= 0.5
                      ? "Decent calibration. This student sometimes over- or under-estimates their understanding."
                      : "Weak calibration — this student's confidence doesn't align well with their actual performance. Consider discussing study strategies."}
                </p>
              </div>
            </div>
          )}

          {/* Overconfident / Underconfident alerts */}
          {(overconfidentConcepts.length > 0 || underconfidentConcepts.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {overconfidentConcepts.length > 0 && (
                <div className={`${card} border-red-500/20`}>
                  <h2 className="text-lg font-semibold text-red-500">Overconfident</h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Low mastery but high self-rated confidence — student may not realise they are struggling.
                  </p>
                  <div className="mt-3 space-y-2">
                    {overconfidentConcepts.map((n) => (
                      <div key={n.id} className="flex items-center justify-between rounded-lg bg-red-500/5 px-3 py-2 text-sm">
                        <span className="text-[var(--text-heading)]">{n.name}</span>
                        <span className="text-xs text-red-500">
                          {Math.round(n.mastery * 100)}% mastery / {Math.round(n.metacognitive_score * 100)}% calibration
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {underconfidentConcepts.length > 0 && (
                <div className={`${card} border-amber-500/20`}>
                  <h2 className="text-lg font-semibold text-amber-500">Underconfident</h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    High mastery but low self-rated confidence — student knows more than they think.
                  </p>
                  <div className="mt-3 space-y-2">
                    {underconfidentConcepts.map((n) => (
                      <div key={n.id} className="flex items-center justify-between rounded-lg bg-amber-500/5 px-3 py-2 text-sm">
                        <span className="text-[var(--text-heading)]">{n.name}</span>
                        <span className="text-xs text-amber-500">
                          {Math.round(n.mastery * 100)}% mastery / {Math.round(n.metacognitive_score * 100)}% calibration
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Knowledge Graph — Open Learner Model */}
          {graphNodes.length > 0 && (
            <div className={card}>
              <h2 className="text-lg font-semibold text-[var(--text-heading)]">
                Knowledge Graph — Open Learner Model
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Click any concept to see the evidence trail behind its mastery score.
              </p>
              <div className="mt-4">
                <ConceptGraph
                  nodes={graph.nodes}
                  links={graph.links}
                  hasMasteryData={graphNodes.some((n) => n.mastery > 0)}
                  width={800}
                  height={450}
                />
              </div>
              {zpdConcepts.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-[var(--text-heading)]">Zone of Proximal Development</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Concepts where this student performs better with hints — their growth edge.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {zpdConcepts.slice(0, 6).map((n) => (
                      <span key={n.id} className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                        {n.name}: {Math.round((n.unaided_mastery || 0) * 100)}% → {Math.round((n.aided_mastery || 0) * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
