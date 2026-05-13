"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { apiGet } from "@/lib/api";
import {
  breadcrumb,
  breadcrumbLink,
  card,
  pageSection,
  progressBar,
  progressTrack,
  statLabel,
} from "@/lib/styles";
import {
  ArrowRightIcon,
  BookIcon,
  BrainIcon,
  ChartIcon,
} from "@/components/layout/icons";

export default function StudentProgressPage() {
  const { user } = useAuth();
  const [quizHistory, setQuizHistory] = useState([]);
  const [calibration, setCalibration] = useState(null);
  const [topicMastery, setTopicMastery] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [history, cal, topics, gam] = await Promise.allSettled([
        apiGet("/analytics/student/quiz-history"),
        apiGet("/analytics/student/calibration"),
        apiGet("/analytics/student/topic-mastery"),
        apiGet("/gamification/me"),
      ]);
      setQuizHistory(history.status === "fulfilled" ? (history.value || []) : []);
      setCalibration(cal.status === "fulfilled" ? cal.value : null);
      setTopicMastery(topics.status === "fulfilled" ? (topics.value || []) : []);
      setGamification(gam.status === "fulfilled" ? gam.value : null);
      setLoading(false);
    }
    fetchData();
  }, []);

  const recentScores = quizHistory.slice(-7);
  const avgScore = quizHistory.length
    ? Math.round(quizHistory.reduce((sum, a) => sum + (a.percentage || 0), 0) / quizHistory.length)
    : 0;
  const masteredCount = topicMastery.filter((t) => t.accuracy >= 80).length;
  const calScore = calibration?.calibration_score;
  const weeklyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const xp = gamification?.xp ?? 0;
  const badges = gamification?.badges || [];

  if (loading) {
    return (
      <section className={pageSection}>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[1.45rem] bg-[var(--color-primary-soft)]" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={pageSection}>
      <nav className={breadcrumb}>
        <Link href="/student" className={breadcrumbLink}>Dashboard</Link>
        <ArrowRightIcon className="h-3 w-3" />
        <span>Progress</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-3">
          <ChartIcon className="h-5 w-5 text-[var(--color-accent)]" />
          <h1 className="font-display text-[clamp(3rem,5vw,4.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            Open Learner Model
          </h1>
        </div>
        <p className="mt-2 text-xl text-[var(--text-muted)]">
          {user?.name ? `${user.name}, this is your transparent learning profile.` : "Your transparent learning profile."}
          {" "}Understand your strengths, track your growth, and own your learning journey.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`${card} p-6`}>
          <p className={statLabel}>Overall Mastery</p>
          <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            {quizHistory.length ? `${avgScore}%` : "—"}
          </p>
          <p className="mt-2 text-sm text-[var(--text-faint)]">
            {quizHistory.length ? `${quizHistory.length} quizzes` : "No quizzes yet"}
          </p>
        </div>

        <div className={`${card} p-6`}>
          <p className={statLabel}>Concepts Mastered</p>
          <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            {topicMastery.length ? `${masteredCount}/${topicMastery.length}` : "—"}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {topicMastery.length
              ? `${Math.round((masteredCount / topicMastery.length) * 100)}% coverage`
              : "No topic data yet"}
          </p>
        </div>

        <div className={`${card} p-6`}>
          <p className={statLabel}>XP Earned</p>
          <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            {xp.toLocaleString()}
          </p>
          {badges.length > 0 && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">{badges.length} badge{badges.length !== 1 ? "s" : ""}</p>
          )}
        </div>

        <div className={`${card} p-6`}>
          <p className={statLabel}>Self-Assessment Accuracy</p>
          <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            {calScore != null ? `${Math.round(calScore * 100)}%` : "—"}
          </p>
          <p className="mt-2 text-sm text-[var(--text-faint)]">
            {calibration?.total_rated ? `${calibration.total_rated} questions rated` : "Rate confidence to track"}
          </p>
        </div>
      </div>

      {recentScores.length > 0 && (
        <div className={`${card} p-7`}>
          <h2 className="font-display text-[2.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            Recent Performance
          </h2>
          <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${recentScores.length}, minmax(0, 1fr))` }}>
            {recentScores.map((attempt, index) => (
              <div key={`${attempt.started_at}-${index}`} className="rounded-[1.1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-5 text-center">
                <div className="flex h-28 items-end justify-center">
                  <div className="flex h-full w-10 items-end rounded-full bg-[var(--bg-sunken)] p-1">
                    <div
                      className="w-full rounded-full bg-[var(--color-accent)]"
                      style={{ height: `${Math.max(attempt.percentage, 10)}%` }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-base font-semibold text-[var(--text-heading)]">{attempt.percentage}%</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{weeklyLabels[index] || "Day"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          {topicMastery.length > 0 ? (
            <div className={`${card} p-7`}>
              <h2 className="font-display text-[2.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Subject Mastery
              </h2>
              <div className="mt-6 space-y-4">
                {topicMastery.map((topic) => (
                  <div key={topic.topic} className="rounded-[1.1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <BookIcon className="h-4 w-4 text-[var(--color-accent)]" />
                        <h3 className="font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--text-heading)]">
                          {topic.topic}
                        </h3>
                      </div>
                      <span className="text-base font-semibold text-[var(--color-accent)]">{topic.accuracy}%</span>
                    </div>
                    <div className="mt-4">
                      <div className={progressTrack}>
                        <div className={progressBar} style={{ width: `${topic.accuracy}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-[var(--text-muted)]">
                      <span>{topic.correct}/{topic.total_questions} correct</span>
                      <span>{topic.accuracy >= 80 ? "Strong grasp" : topic.accuracy >= 60 ? "Still improving" : "Needs review"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`${card} p-7`}>
              <h2 className="font-display text-[2.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Subject Mastery
              </h2>
              <p className="mt-4 text-[var(--text-faint)]">No topic mastery data yet. Complete quizzes in your classrooms to build your mastery profile.</p>
            </div>
          )}

          {quizHistory.filter((a) => a.reflection).length > 0 && (
            <div className={`${card} p-7`}>
              <h2 className="font-display text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Recent Reflections
              </h2>
              <div className="mt-5 space-y-3">
                {quizHistory
                  .filter((attempt) => attempt.reflection)
                  .slice(-4)
                  .reverse()
                  .map((attempt, index) => (
                    <div key={`${attempt.started_at}-${index}`} className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-4">
                      <p className="text-sm leading-7 text-[var(--text-secondary)]">&ldquo;{attempt.reflection}&rdquo;</p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-faint)]">
                        <span>Score: {attempt.percentage}%</span>
                        <span>{attempt.started_at?.split("T")[0]}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className={`${card} p-6`}>
            <div className="flex items-center gap-3">
              <BrainIcon className="h-5 w-5 text-[var(--color-accent)]" />
              <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Metacognitive Insight
              </h2>
            </div>
            {calScore != null ? (
              <>
                <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                  Your self-assessment accuracy is{" "}
                  <span className="font-semibold text-[var(--color-accent)]">
                    {Math.round(calScore * 100)}%
                  </span>.
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                  {calScore >= 0.75
                    ? "Great calibration. Your confidence is tracking closely with your real performance."
                    : calScore >= 0.5
                      ? "Reasonable calibration. Keep checking where you feel confident but still lose marks."
                      : "Your confidence and performance still diverge often. Slow down and review uncertain areas more deliberately."}
                </p>
                <p className="mt-3 text-sm text-[var(--text-faint)]">{calibration?.total_rated || 0} questions rated</p>
              </>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-faint)]">
                Rate your confidence on quiz questions to see how accurately you assess yourself.
              </p>
            )}
          </div>

          {badges.length > 0 && (
            <div className={`${card} p-6`}>
              <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Badges
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-[0.75rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
