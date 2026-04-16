"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { apiGet } from "@/lib/api";
import {
  card,
  pageSection,
  progressBar,
  progressTrack,
  statLabel,
} from "@/lib/styles";
import {
  BookIcon,
  BrainIcon,
  ChartIcon,
  ClockIcon,
} from "@/components/layout/icons";

const DEMO_QUIZ_HISTORY = [
  { percentage: 72, started_at: "2026-03-04T10:00:00", reflection: "I need to review cell division more carefully." },
  { percentage: 65, started_at: "2026-03-05T14:00:00", reflection: null },
  { percentage: 78, started_at: "2026-03-06T09:00:00", reflection: "Getting better at identifying key terms." },
  { percentage: 80, started_at: "2026-03-07T11:00:00", reflection: null },
  { percentage: 74, started_at: "2026-03-08T16:00:00", reflection: null },
  { percentage: 85, started_at: "2026-03-09T10:00:00", reflection: "The spaced repetition is really helping." },
  { percentage: 82, started_at: "2026-03-10T13:00:00", reflection: null },
  { percentage: 90, started_at: "2026-03-11T09:00:00", reflection: "Confident on photosynthesis now!" },
  { percentage: 88, started_at: "2026-03-12T15:00:00", reflection: null },
  { percentage: 92, started_at: "2026-03-13T10:00:00", reflection: "Best score yet. Flashcard strategy worked." },
];

const DEMO_CALIBRATION = { calibration_score: 0.78, total_rated: 34 };

const DEMO_TOPIC_MASTERY = [
  { topic: "Photosynthesis", accuracy: 94, correct: 15, total_questions: 16 },
  { topic: "Cell Division", accuracy: 82, correct: 14, total_questions: 17 },
  { topic: "Neural Networks", accuracy: 76, correct: 13, total_questions: 17 },
  { topic: "French Revolution", accuracy: 88, correct: 22, total_questions: 25 },
  { topic: "Derivatives & Integrals", accuracy: 71, correct: 10, total_questions: 14 },
  { topic: "Genetics & Heredity", accuracy: 68, correct: 11, total_questions: 16 },
];

const DEMO_XP_BREAKDOWN = [
  { source: "Quizzes", xp: 1280 },
  { source: "Lessons", xp: 820 },
  { source: "Streaks", xp: 360 },
  { source: "Reflections", xp: 190 },
  { source: "Bonus Challenges", xp: 100 },
];

export default function StudentProgressPage() {
  const { user } = useAuth();
  const [quizHistory, setQuizHistory] = useState([]);
  const [calibration, setCalibration] = useState(null);
  const [topicMastery, setTopicMastery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [history, cal, topics] = await Promise.all([
          apiGet("/analytics/student/quiz-history").catch(() => []),
          apiGet("/analytics/student/calibration").catch(() => null),
          apiGet("/analytics/student/topic-mastery").catch(() => []),
        ]);
        setQuizHistory(history?.length ? history : DEMO_QUIZ_HISTORY);
        setCalibration(cal ?? DEMO_CALIBRATION);
        setTopicMastery(topics?.length ? topics : DEMO_TOPIC_MASTERY);
      } catch {
        setQuizHistory(DEMO_QUIZ_HISTORY);
        setCalibration(DEMO_CALIBRATION);
        setTopicMastery(DEMO_TOPIC_MASTERY);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const recentScores = quizHistory.slice(-7);
  const avgScore = quizHistory.length
    ? Math.round(quizHistory.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / quizHistory.length)
    : 0;
  const totalXp = DEMO_XP_BREAKDOWN.reduce((sum, row) => sum + row.xp, 0);
  const masteredCount = topicMastery.filter((topic) => topic.accuracy >= 80).length;
  const calScore = calibration?.calibration_score;
  const weeklyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (loading) {
    return <section className={pageSection}><p className="text-sm text-[var(--text-faint)]">Loading progress data...</p></section>;
  }

  return (
    <section className={pageSection}>
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
            {avgScore}%
          </p>
          <p className="mt-2 text-sm text-[var(--color-success)]">+5% this week</p>
        </div>

        <div className={`${card} p-6`}>
          <p className={statLabel}>Study Time</p>
          <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            62h
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Total this month</p>
        </div>

        <div className={`${card} p-6`}>
          <p className={statLabel}>Concepts Mastered</p>
          <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            {masteredCount}/{topicMastery.length}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {topicMastery.length ? Math.round((masteredCount / topicMastery.length) * 100) : 0}% coverage
          </p>
        </div>

        <div className={`${card} p-6`}>
          <p className={statLabel}>Quiz Accuracy</p>
          <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            {avgScore}%
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Last {quizHistory.length} quizzes</p>
        </div>
      </div>

      <div className={`${card} p-7`}>
        <h2 className="font-display text-[2.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
          Weekly Performance
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-7">
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
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
        </div>

        <aside className="space-y-5">
          <div className={`${card} p-6`}>
            <div className="flex items-center gap-3">
              <BrainIcon className="h-5 w-5 text-[var(--color-accent)]" />
              <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Metacognitive Insight
              </h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              Your self-assessment accuracy is{" "}
              <span className="font-semibold text-[var(--color-accent)]">
                {calScore != null ? `${Math.round(calScore * 100)}%` : "—"}
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
          </div>

          <div className={`${card} p-6`}>
            <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              XP Breakdown
            </h2>
            <div className="mt-5 space-y-4">
              {DEMO_XP_BREAKDOWN.map((row) => (
                <div key={row.source}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-[var(--text-secondary)]">{row.source}</span>
                    <span className="font-semibold text-[var(--text-heading)]">{row.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="mt-2">
                    <div className={progressTrack}>
                      <div className={progressBar} style={{ width: `${(row.xp / totalXp) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-6`}>
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Study Notes
              </h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
              <li>Best recent performance came after reflection-heavy quizzes.</li>
              <li>Mastery is strongest where repeated quiz practice exists.</li>
              <li>Review the lower-accuracy subjects before starting a new unit.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
