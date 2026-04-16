"use client";

import Link from "next/link";
import { card, btnPrimary, btnSecondary, badgeCyan, badgeViolet, badgeSuccess } from "@/lib/styles";

/* ------------------------------------------------------------------ */
/*  Assessment Results — shown after completing a teach-back session    */
/* ------------------------------------------------------------------ */

const DIMENSIONS = [
  { key: "completeness", label: "Completeness", color: "var(--color-primary)" },
  { key: "accuracy",     label: "Accuracy",     color: "var(--color-success)" },
  { key: "clarity",      label: "Clarity",      color: "var(--color-accent)" },
  { key: "depth",        label: "Depth",         color: "#a78bfa" },
];

const BADGE_LABELS = {
  first_teaching: "First Teaching Session",
  clear_explainer: "Clear Explainer",
  patient_teacher: "Patient Teacher",
};

export default function AssessmentResults({ session, classroomId, lessonId, onRetry }) {
  const a = session.assessment || {};
  const overall = session.overall_score ?? 0;
  const xpEarned = session.xp_earned ?? 0;

  const scoreColor =
    overall >= 0.8 ? "var(--color-success)" :
    overall >= 0.6 ? "var(--color-accent)" :
    "var(--color-danger)";

  const scoreLabel =
    overall >= 0.8 ? "Excellent" :
    overall >= 0.6 ? "Good" :
    overall >= 0.4 ? "Developing" :
    "Needs Practice";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Overall score hero */}
      <div className={`${card} space-y-4 p-8 text-center`}>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
          Teaching Assessment
        </p>
        <div
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4"
          style={{ borderColor: scoreColor }}
        >
          <div>
            <p className="text-3xl font-bold" style={{ color: scoreColor }}>
              {Math.round(overall * 100)}%
            </p>
            <p className="text-xs font-medium text-[var(--text-faint)]">{scoreLabel}</p>
          </div>
        </div>
        {a.feedback && (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{a.feedback}</p>
        )}
        {xpEarned > 0 && (
          <p className="text-sm font-semibold text-[var(--color-primary)]">+{xpEarned} XP earned</p>
        )}
      </div>

      {/* Dimension bars */}
      <div className={`${card} space-y-4 p-6`}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)]">
          Quality Breakdown
        </h3>
        {DIMENSIONS.map((dim) => {
          const val = a[dim.key] ?? 0;
          return (
            <div key={dim.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--text-primary)]">{dim.label}</span>
                <span className="font-semibold" style={{ color: dim.color }}>
                  {Math.round(val * 100)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${val * 100}%`, backgroundColor: dim.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Strengths & improvements */}
      <div className="grid gap-4 sm:grid-cols-2">
        {a.strengths?.length > 0 && (
          <div className={`${card} space-y-3 p-5`}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-success)]">
              Strengths
            </h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {a.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--color-success)]">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {a.improvements?.length > 0 && (
          <div className={`${card} space-y-3 p-5`}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Areas to Improve
            </h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {a.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--color-accent)]">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Badges earned */}
      {session.badges_earned?.length > 0 && (
        <div className={`${card} space-y-3 p-5`}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)]">
            Badges Earned
          </h3>
          <div className="flex flex-wrap gap-2">
            {session.badges_earned.map((b) => (
              <span key={b} className={badgeViolet}>
                {BADGE_LABELS[b] || b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button className={btnPrimary} onClick={onRetry} aria-label="Try teaching again">
          Try Again
        </button>
        <Link
          className={btnSecondary}
          href={`/student/classrooms/${classroomId}/lessons/${lessonId}`}
          aria-label="Back to lesson"
        >
          Back to Lesson
        </Link>
        <Link
          className={btnSecondary}
          href={`/student/classrooms/${classroomId}`}
          aria-label="Back to classroom"
        >
          Back to Classroom
        </Link>
      </div>
    </div>
  );
}
